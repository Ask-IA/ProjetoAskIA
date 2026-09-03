# --- Etapa 1: build (compila o projeto com Maven) ---
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# copia só o pom.xml primeiro, pra aproveitar cache de dependências
# (se o pom não mudar, o Docker não baixa tudo de novo a cada build)
COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

# --- Etapa 2: runtime (imagem final, só com o Java pra rodar o jar) ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]