-- AlterTable: rename producer to winery
ALTER TABLE "Wine" RENAME COLUMN "producer" TO "winery";

-- AlterTable: add amount and grapes columns
ALTER TABLE "Wine" ADD COLUMN "amount" INTEGER;
ALTER TABLE "Wine" ADD COLUMN "grapes" TEXT;
