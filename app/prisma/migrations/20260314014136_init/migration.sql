-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'consultor',
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "avatar" TEXT,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoAcesso" DATETIME
);

-- CreateTable
CREATE TABLE "Diagnostico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaNome" TEXT NOT NULL,
    "empresaCidade" TEXT NOT NULL,
    "empresaEstado" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoPorId" TEXT NOT NULL,
    CONSTRAINT "Diagnostico_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cargo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cargoKey" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "existe" BOOLEAN NOT NULL DEFAULT true,
    "acumulaFuncao" TEXT,
    "personalizado" BOOLEAN NOT NULL DEFAULT false,
    "subordinadosDe" TEXT,
    "diagnosticoId" TEXT NOT NULL,
    CONSTRAINT "Cargo_diagnosticoId_fkey" FOREIGN KEY ("diagnosticoId") REFERENCES "Diagnostico" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tarefa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    CONSTRAINT "Tarefa_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Metrica" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    CONSTRAINT "Metrica_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ferramenta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    CONSTRAINT "Ferramenta_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subordinado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cargoKey" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    CONSTRAINT "Subordinado_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FerramentaGeral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "diagnosticoId" TEXT NOT NULL,
    CONSTRAINT "FerramentaGeral_diagnosticoId_fkey" FOREIGN KEY ("diagnosticoId") REFERENCES "Diagnostico" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProblemaIdentificado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "diagnosticoId" TEXT NOT NULL,
    CONSTRAINT "ProblemaIdentificado_diagnosticoId_fkey" FOREIGN KEY ("diagnosticoId") REFERENCES "Diagnostico" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
