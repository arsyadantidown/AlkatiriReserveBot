/*
  Warnings:

  - Added the required column `category` to the `Recipe` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "category" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 0;
