package com.aski.IA.service;

import java.util.List;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.stereotype.Service;

import com.aski.IA.dto.CartaoGeradoDTO;
import com.aski.IA.dto.FlashcardsGeradosDTO;
import com.aski.IA.dto.QuestaoGeradaDTO;
import com.aski.IA.dto.QuizGeradoDTO;
import com.aski.IA.dto.RespostaIaDTO;
import com.aski.IA.exception.IaIndisponivelException;
import com.aski.IA.model.ModoAjuda;

/**
 * Fala com o modelo da OpenAI (via Spring AI) e devolve a resposta já no formato que o resto do
 * sistema espera — pronta para ConversaService.registrarInteracao() gravar no histórico, ou para
 * RevisaoService montar flashcards/quiz.
 *
 * Três conversas possíveis com o modelo, cada uma com seu próprio contrato JSON (RespostaIaDTO,
 * FlashcardsGeradosDTO, QuizGeradoDTO) — por isso há um BeanOutputConverter para cada uma.
 *
 * A key vem de app.ia.openai (spring.ai.openai.api-key, lido de OPENAI_API_KEY no .env). Sem key
 * configurada, a chamada ao modelo falha e vira IaIndisponivelException — o resto do app continua
 * funcionando normalmente.
 */
@Service
public class IaService {

    private static final String AREAS = "linguagens, humanas, natureza, matematica";

    private final ChatClient chatClient;
    private final BeanOutputConverter<RespostaIaDTO> conversorResposta = new BeanOutputConverter<>(RespostaIaDTO.class);
    private final BeanOutputConverter<FlashcardsGeradosDTO> conversorFlashcards = new BeanOutputConverter<>(FlashcardsGeradosDTO.class);
    private final BeanOutputConverter<QuizGeradoDTO> conversorQuiz = new BeanOutputConverter<>(QuizGeradoDTO.class);

    public IaService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    // ---------- Ask IA (explicar / resolver / plano) ----------

    public RespostaIaDTO perguntar(String pergunta, ModoAjuda modo) {
        String prompt = pergunta + "\n\n" + conversorResposta.getFormat();
        String bruto = chamarModelo(promptDeSistema(modo), prompt);
        RespostaIaDTO resposta = converter(bruto, conversorResposta);
        if (resposta.passos() == null || resposta.passos().isEmpty()) {
            throw new IaIndisponivelException("A IA devolveu uma resposta sem nenhum passo. Tente reformular a pergunta.");
        }
        return resposta;
    }

    // ---------- Flashcards ----------

    public List<CartaoGeradoDTO> gerarFlashcards(String materia, List<String> topicos) {
        String prompt = "Matéria: " + materia + "\n"
                + "Tópicos cadastrados pelo aluno: " + descreverTopicos(topicos) + "\n\n"
                + conversorFlashcards.getFormat();
        String bruto = chamarModelo(promptSistemaFlashcards(), prompt);
        FlashcardsGeradosDTO resultado = converter(bruto, conversorFlashcards);
        if (resultado.cartoes() == null || resultado.cartoes().isEmpty()) {
            throw new IaIndisponivelException("A IA não conseguiu gerar flashcards para essa matéria agora.");
        }
        return resultado.cartoes();
    }

    // ---------- Quiz ----------

    public List<QuestaoGeradaDTO> gerarQuiz(String materia, List<String> topicos) {
        String prompt = "Matéria: " + materia + "\n"
                + "Tópicos cadastrados pelo aluno: " + descreverTopicos(topicos) + "\n\n"
                + conversorQuiz.getFormat();
        String bruto = chamarModelo(promptSistemaQuiz(), prompt);
        QuizGeradoDTO resultado = converter(bruto, conversorQuiz);
        if (resultado.questoes() == null || resultado.questoes().isEmpty()) {
            throw new IaIndisponivelException("A IA não conseguiu gerar um quiz para essa matéria agora.");
        }
        return resultado.questoes();
    }

    // ---------- auxiliares ----------

    private String descreverTopicos(List<String> topicos) {
        return (topicos == null || topicos.isEmpty())
                ? "(nenhum tópico específico cadastrado — use o conteúdo geral da matéria no nível do ENEM)"
                : String.join(", ", topicos);
    }

    /** Chama o modelo e já trata falha de rede/API — todo método público passa por aqui. */
    private String chamarModelo(String sistema, String prompt) {
        String bruto;
        try {
            bruto = chatClient.prompt()
                    .system(sistema)
                    .user(prompt)
                    .call()
                    .content();
        } catch (RuntimeException e) {
            throw new IaIndisponivelException(
                    "Não foi possível falar com a IA agora. Tente novamente em instantes.", e);
        }
        if (bruto == null || bruto.isBlank()) {
            throw new IaIndisponivelException("A IA não devolveu uma resposta. Tente novamente.");
        }
        return bruto;
    }

    /** Converte o JSON cru da IA no DTO esperado, com a MESMA mensagem de erro pros três usos. */
    private <T> T converter(String bruto, BeanOutputConverter<T> conversor) {
        try {
            return conversor.convert(bruto);
        } catch (RuntimeException e) {
            throw new IaIndisponivelException(
                    "A IA devolveu uma resposta em formato inesperado. Tente novamente.", e);
        }
    }

    private String promptDeSistema(ModoAjuda modo) {
        String instrucaoDoModo = switch (modo) {
            case EXPLICAR -> "Explique o conceito do zero, com um exemplo prático. 3 a 5 passos.";
            case RESOLVER -> "Resolva o exercício enviado pelo aluno, um passo de raciocínio por vez "
                    + "(o aluno tenta cada passo antes de ver o próximo). 3 a 6 passos.";
            case PLANO -> "Monte um plano de estudo curto (3 a 5 dias) para o assunto perguntado. Cada "
                    + "passo é um dia, com o título no formato 'Dia N · Nome da etapa (X min)'.";
        };

        return """
                Você é o Ask IA, assistente de estudos para o ENEM e vestibulares brasileiros, dentro do \
                app Ask.IA. Responda SEMPRE em português do Brasil, em linguagem simples e direta, como um \
                professor particular explicando para um estudante do ensino médio.

                Modo escolhido pelo aluno: %s. %s

                Regras do conteúdo:
                - "area": uma destas 4, em minúsculas, a que o assunto pertence no ENEM: %s. Use null se a \
                pergunta não se encaixar em nenhuma.
                - "topico": nome curto do assunto (ex.: "Função afim"), ou null se não for um tópico específico.
                - "passos": lista ordenada. Cada passo tem "titulo" (curto), "conteudo" (1 a 3 frases) e \
                "formula" (opcional, só quando fizer sentido).
                - "formula", quando presente, é SEMPRE em LaTeX (sem os delimitadores $ ou \\( \\) — só o \
                código), ex.: "f(x) = a \\cdot x + b" ou "\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}". O frontend \
                renderiza isso com KaTeX.
                - Dentro de "conteudo", marque de 1 a 3 termos-chave entre sinais de igual duplos, assim: \
                "O a é a ==taxa de variação==". NÃO use markdown (sem **negrito**, sem #título) e NÃO coloque \
                fórmulas dentro de "conteudo" — fórmula vai sempre no campo "formula".
                - "tenteVoce": um exercício curto relacionado, com "pergunta" e "resposta". Use null apenas \
                no modo Plano.
                - Nunca invente fatos. Se não tiver certeza de algo factual (datas, números), diga que não \
                tem certeza em vez de inventar.
                """.formatted(modo.name().toLowerCase(), instrucaoDoModo, AREAS);
    }

    private String promptSistemaFlashcards() {
        return """
                Você é o Ask IA, assistente de estudos para o ENEM e vestibulares brasileiros. Gere \
                flashcards de revisão em português do Brasil para a matéria e os tópicos informados pelo \
                aluno a seguir.

                Regras:
                - Gere entre 6 e 10 cartões, cobrindo os tópicos informados de forma equilibrada (não \
                concentre tudo em um só). Se não houver tópicos específicos, cubra os assuntos mais \
                importantes da matéria no nível do ENEM.
                - "frente": uma pergunta curta ou um conceito-chave (ex.: "O que é uma função afim?").
                - "verso": a resposta objetiva, em 1 a 3 frases — sem rodeios, direto ao ponto.
                - Não use markdown nem LaTeX nos flashcards: texto simples, incluindo fórmulas (ex.: \
                "f(x) = a*x + b"), já que o cartão não tem renderização matemática.
                - Nunca invente fatos. Se não tiver certeza de algo factual, prefira um cartão mais \
                conceitual a arriscar um dado errado.
                """;
    }

    private String promptSistemaQuiz() {
        return """
                Você é o Ask IA, assistente de estudos para o ENEM e vestibulares brasileiros. Gere um \
                quiz de múltipla escolha em português do Brasil para a matéria e os tópicos informados \
                pelo aluno a seguir.

                Regras:
                - Gere entre 5 e 8 questões, cobrindo os tópicos informados de forma equilibrada. Se não \
                houver tópicos específicos, cubra os assuntos mais importantes da matéria no nível do ENEM.
                - "enunciado": o enunciado da questão, direto e sem ambiguidade.
                - "alternativas": exatamente 4 alternativas (strings), plausíveis — nada de opções \
                absurdas só pra completar.
                - "correta": o ÍNDICE (0, 1, 2 ou 3) da alternativa certa dentro de "alternativas".
                - "explicacao": 1 frase objetiva dizendo por que a alternativa certa é a certa.
                - Não use markdown nem LaTeX: texto simples, incluindo fórmulas, já que as alternativas \
                não têm renderização matemática.
                - Nunca invente fatos. Evite perguntas que dependam de datas ou números muito específicos \
                se você não tiver certeza deles.
                """;
    }
}
