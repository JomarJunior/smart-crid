Para rodar esse projeto você precisa ter o Docker instalado com o Docker Compose, além do Node.js e npm.

### Iniciar os containers:
```bash
./scripts/docker-dev.sh up
```

### Compilar os contratos:
```bash
npm run compile
```

### Rodar os testes:
```bash
npm run ci
```

### Fazer o deploy dos contratos bara a blockchain de testes:
```bash
npm run deploy
```

### Acessar a interface do usuário:
Acesse o endereço `http://localhost:5173` no seu navegador.