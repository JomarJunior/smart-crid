// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CRID (Certificado de Registro de Inscrição em Disciplinas)
 * @author Gemini
 * @dev Este smart contract gerencia a criação de matérias, inscrição de alunos e
 * lançamento de notas. Possui um sistema de controle de acesso para distinguir
 * as ações de Professores e de um Administrador (owner).
 */
contract Crid {
    //================================================================
    // State Variables (Variáveis de Estado)
    //================================================================

    address public owner;
    mapping(address => bool) public ehProfessor;

    struct Materia {
        uint id;
        string nome;
        address professor; // Endereço do professor que criou a matéria
    }

    struct Inscricao {
        uint nota;
        bool notaLancada;
    }

    // Mapeamento para acessar os detalhes de uma matéria pelo seu ID.
    mapping(uint => Materia) public materias;
    uint public proximoIdMateria;

    // Mapeamento para verificar se um aluno está inscrito em uma matéria.
    // Evita inscrições duplicadas e serve como trava de segurança.
    mapping(address => mapping(uint => bool)) public estaInscrito;

    // Mapeamento aninhado para guardar a inscrição (e nota) de um aluno em uma matéria.
    // Estrutura: mapping(aluno => mapping(id_da_materia => DetalhesDaInscricao))
    mapping(address => mapping(uint => Inscricao)) public inscricoes;

    // Mapeamento para que um aluno possa consultar suas matérias de forma eficiente.
    // Guarda uma lista dos IDs das matérias em que o aluno está inscrito.
    mapping(address => uint[]) private materiasDoAluno;

    //================================================================
    // Events (Eventos)
    //================================================================

    event ProfessorAdicionado(address indexed professor);
    event ProfessorRemovido(address indexed professor);
    event MateriaCriada(uint indexed id, string nome, address indexed professor);
    event AlunoInscrito(address indexed aluno, uint indexed idMateria);
    event NotaLancada(address indexed aluno, uint indexed idMateria, uint nota);

    //================================================================
    // Modifiers (Modificadores de Acesso)
    //================================================================

    modifier apenasOwner() {
        require(msg.sender == owner, "CRID: Acao permitida apenas para o dono do contrato.");
        _;
    }

    modifier apenasProfessor() {
        require(ehProfessor[msg.sender], "CRID: Acao permitida apenas para professores.");
        _;
    }

    //================================================================
    // Constructor
    //================================================================

    /**
     * @dev Define o criador do contrato como 'owner' e inicia o contador de matérias.
     */
    constructor() {
        owner = msg.sender;
        proximoIdMateria = 1; // IDs de matéria começarão em 1
    }

    //================================================================
    // Admin Functions (Funções Administrativas)
    //================================================================

    /**
     * @dev Permite que o 'owner' adicione um novo endereço ao papel de professor.
     * @param _novoProfessor O endereço da conta a ser designada como professor.
     */
    function adicionarProfessor(address _novoProfessor) external apenasOwner {
        require(_novoProfessor != address(0), "CRID: Endereco invalido.");
        ehProfessor[_novoProfessor] = true;
        emit ProfessorAdicionado(_novoProfessor);
    }

    /**
     * @dev Permite que o 'owner' remova o papel de professor de um endereço.
     * @param _professor O endereço da conta a ter o papel de professor removido.
     */
    function removerProfessor(address _professor) external apenasOwner {
        require(_professor != address(0), "CRID: Endereco invalido.");
        ehProfessor[_professor] = false;
        emit ProfessorRemovido(_professor);
    }

    //================================================================
    // Professor Functions (Funções do Professor)
    //================================================================

    /**
     * @dev Cria uma nova matéria. A matéria é associada ao professor que chama a função.
     * @param _nome O nome da nova matéria (ex: "Calculo I").
     */
    function criarMateria(string memory _nome) external apenasProfessor {
        uint id = proximoIdMateria;
        materias[id] = Materia(id, _nome, msg.sender);
        proximoIdMateria++;
        emit MateriaCriada(id, _nome, msg.sender);
    }

    /**
     * @dev Inscreve um aluno em uma matéria. Somente o professor que criou a matéria pode inscrever alunos.
     * @param _aluno O endereço do aluno a ser inscrito.
     * @param _idMateria O ID da matéria na qual o aluno será inscrito.
     */
    function inclusaoAluno(address _aluno, uint _idMateria) external apenasProfessor {
        require(materias[_idMateria].id != 0, "CRID: Materia nao existe.");
        require(materias[_idMateria].professor == msg.sender, "CRID: Voce nao e o professor desta materia.");
        require(!estaInscrito[_aluno][_idMateria], "CRID: Aluno ja esta inscrito nesta materia.");
        
        estaInscrito[_aluno][_idMateria] = true;
        materiasDoAluno[_aluno].push(_idMateria);
        inscricoes[_aluno][_idMateria] = Inscricao(0, false); // Nota 0, não lançada

        emit AlunoInscrito(_aluno, _idMateria);
    }

    /**
     * @dev Lança ou atualiza a nota de um aluno em uma matéria.
     * @param _aluno O endereço do aluno.
     * @param _idMateria O ID da matéria.
     * @param _nota A nota a ser atribuída (de 0 a 100).
     */
    function lancarNota(address _aluno, uint _idMateria, uint _nota) external apenasProfessor {
        require(materias[_idMateria].id != 0, "CRID: Materia nao existe.");
        require(materias[_idMateria].professor == msg.sender, "CRID: Voce nao e o professor desta materia.");
        require(estaInscrito[_aluno][_idMateria], "CRID: Aluno nao esta inscrito na materia.");
        require(_nota <= 100, "CRID: A nota deve ser entre 0 e 100.");

        inscricoes[_aluno][_idMateria] = Inscricao(_nota, true);
        emit NotaLancada(_aluno, _idMateria, _nota);
    }

    //================================================================
    // Student/View Functions (Funções de Consulta do Aluno)
    //================================================================

    /**
     * @dev Estrutura de dados para retornar os detalhes da inscrição de forma organizada.
     * O frontend não precisa saber o ID, apenas os detalhes.
     */
    struct DetalhesInscricao {
        string nomeMateria;
        address professor;
        string nomeProfessor; // Adicionamos este campo para facilitar o frontend
        uint nota;
        bool notaLancada;
    }

    /**
     * @dev Retorna todas as matérias em que o aluno (quem chama a função) está inscrito.
     * @return Uma lista com os detalhes de cada inscrição.
     */
    function getMinhasMaterias() public view returns (DetalhesInscricao[] memory) {
        uint[] storage idsDasMaterias = materiasDoAluno[msg.sender];
        uint totalMaterias = idsDasMaterias.length;
        DetalhesInscricao[] memory resultado = new DetalhesInscricao[](totalMaterias);

        for (uint i = 0; i < totalMaterias; i++) {
            uint idMateria = idsDasMaterias[i];
            Materia storage materia = materias[idMateria];
            Inscricao storage inscricao = inscricoes[msg.sender][idMateria];
            
            resultado[i] = DetalhesInscricao({
                nomeMateria: materia.nome,
                professor: materia.professor,
                nomeProfessor: "", // Este campo seria preenchido por um sistema de perfis fora da cadeia
                nota: inscricao.nota,
                notaLancada: inscricao.notaLancada
            });
        }

        return resultado;
    }

    /**
     * @dev Retorna o número de matérias em que um aluno está inscrito.
     * Útil para paginação ou verificações no frontend.
     */
    function getContagemMinhasMaterias() public view returns (uint) {
        return materiasDoAluno[msg.sender].length;
    }
}