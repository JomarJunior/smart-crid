const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Contrato CRID", function () {
  // Variáveis que serão usadas em múltiplos testes
  let CRID;
  let crid;
  let owner, prof1, prof2, aluno1, aluno2;

  // O bloco `beforeEach` é executado antes de CADA teste (`it`).
  // Isso garante que os testes sejam independentes, começando com um contrato "limpo".
  beforeEach(async function () {
    // Pega as contas de teste fornecidas pelo Hardhat
    [owner, prof1, prof2, aluno1, aluno2] = await ethers.getSigners();

    // Faz o deploy de uma nova instância do contrato
    const CRID_Factory = await ethers.getContractFactory("Crid");
    crid = await CRID_Factory.deploy();
    await crid.waitForDeployment();
  });

  // Suíte de testes para Implantação e Gerenciamento de Papéis
  describe("Implantação e Papéis (Deployment and Roles)", function () {
    it("Deve definir o deployer como owner", async function () {
      expect(await crid.owner()).to.equal(owner.address);
    });

    it("Deve permitir que o owner adicione um professor", async function () {
      await crid.connect(owner).adicionarProfessor(prof1.address);
      expect(await crid.ehProfessor(prof1.address)).to.be.true;
    });

    it("NÃO deve permitir que uma conta não-owner adicione um professor", async function () {
      // Usamos `revertedWith` para testar se a transação falha com a mensagem esperada
      await expect(
        crid.connect(aluno1).adicionarProfessor(prof2.address)
      ).to.be.revertedWith("CRID: Acao permitida apenas para o dono do contrato.");
    });
  });

  // Suíte de testes para as Funções do Professor
  describe("Funções do Professor", function () {
    // Antes dos testes desta suíte, vamos pré-configurar um professor
    beforeEach(async function () {
      await crid.connect(owner).adicionarProfessor(prof1.address);
    });

    it("Deve permitir que um professor crie uma matéria", async function () {
      await crid.connect(prof1).criarMateria("Cálculo I");
      const materia = await crid.materias(1);
      
      expect(materia.id).to.equal(1);
      expect(materia.nome).to.equal("Cálculo I");
      expect(materia.professor).to.equal(prof1.address);
    });

    it("NÃO deve permitir que um aluno crie uma matéria", async function () {
      await expect(
        crid.connect(aluno1).criarMateria("Tentativa de Fraude")
      ).to.be.revertedWith("CRID: Acao permitida apenas para professores.");
    });

    it("Deve permitir que um professor inscreva um aluno em sua matéria", async function () {
      await crid.connect(prof1).criarMateria("Blockchain 101"); // ID será 1
      await crid.connect(prof1).inclusaoAluno(aluno1.address, 1);
      
      expect(await crid.estaInscrito(aluno1.address, 1)).to.be.true;
    });

    it("Deve permitir que um professor lance a nota de um aluno inscrito", async function () {
        await crid.connect(prof1).criarMateria("Solidity Avançado"); // ID será 1
        await crid.connect(prof1).inclusaoAluno(aluno1.address, 1);
        await crid.connect(prof1).lancarNota(aluno1.address, 1, 95); // Nota 95

        const inscricao = await crid.inscricoes(aluno1.address, 1);
        expect(inscricao.nota).to.equal(95);
        expect(inscricao.notaLancada).to.be.true;
    });

    it("NÃO deve permitir que um professor lance nota para matéria de outro professor", async function() {
      // prof1 cria a matéria
      await crid.connect(prof1).criarMateria("Cálculo I"); // ID 1
      await crid.connect(prof1).inclusaoAluno(aluno1.address, 1);

      // prof2 (que também precisa ser professor) tenta lançar a nota
      await crid.connect(owner).adicionarProfessor(prof2.address);
      
      await expect(
        crid.connect(prof2).lancarNota(aluno1.address, 1, 80)
      ).to.be.revertedWith("CRID: Voce nao e o professor desta materia.");
    });
  });

  // Suíte de testes para a Visão do Aluno
  describe("Funções do Aluno e Visibilidade", function () {
    it("Deve retornar a lista de matérias de um aluno com notas e pendências", async function () {
      // Setup: Adicionar 2 professores e criar 3 matérias
      await crid.connect(owner).adicionarProfessor(prof1.address);
      await crid.connect(owner).adicionarProfessor(prof2.address);
      
      await crid.connect(prof1).criarMateria("Cálculo I");         // ID 1
      await crid.connect(prof1).criarMateria("Física Quântica");   // ID 2
      await crid.connect(prof2).criarMateria("Direito Digital");    // ID 3

      // Setup: Inscrever aluno1 em 2 matérias
      await crid.connect(prof1).inclusaoAluno(aluno1.address, 1);
      await crid.connect(prof2).inclusaoAluno(aluno1.address, 3);
      
      // Setup: Lançar nota para apenas uma das matérias
      await crid.connect(prof1).lancarNota(aluno1.address, 1, 88);

      // Ação: Aluno consulta suas matérias
      const minhasMaterias = await crid.connect(aluno1).getMinhasMaterias();

      // Verificações
      expect(minhasMaterias.length).to.equal(2);

      // 1. Matéria "Cálculo I" com nota
      expect(minhasMaterias[0].nomeMateria).to.equal("Cálculo I");
      expect(minhasMaterias[0].professor).to.equal(prof1.address);
      expect(minhasMaterias[0].nota).to.equal(88);
      expect(minhasMaterias[0].notaLancada).to.be.true;

      // 2. Matéria "Direito Digital" sem nota
      expect(minhasMaterias[1].nomeMateria).to.equal("Direito Digital");
      expect(minhasMaterias[1].professor).to.equal(prof2.address);
      expect(minhasMaterias[1].nota).to.equal(0);
      expect(minhasMaterias[1].notaLancada).to.be.false;
    });
  });
});