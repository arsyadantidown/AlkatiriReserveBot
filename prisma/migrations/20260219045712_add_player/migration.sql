-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "ingameName" TEXT NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_userId_key" ON "Player"("userId");
