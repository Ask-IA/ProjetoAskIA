USE Ask_db;

create table users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    passwords VARCHAR(100) NOT NULL,
    nameFirst VARCHAR(100) NOT NULL, 
    sobreNome VARCHAR(100) NOT NULL,
    matricula VARCHAR(100) NOT NULL,
    cpf VARCHAR(100),
    sexo TINYINT,
    dtaNascimento DATE,	
    email VARCHAR(100),
    telefone VARCHAR(100),
    funcao VARCHAR(100),
    cep VARCHAR(100),          
    endereco VARCHAR(255),    
    cidade VARCHAR(100),
    bairro VARCHAR(100),
    estado VARCHAR(50),       
    numero LONG,       
    complemento VARCHAR(100)	
);