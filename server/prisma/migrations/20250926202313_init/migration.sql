-- CreateEnum
CREATE TYPE "public"."WineType" AS ENUM ('RED', 'WHITE', 'ROSE', 'SPARKLING', 'ORANGE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Wine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."WineType" NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "producer" TEXT,
    "vintage" INTEGER,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_UserWines" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserWines_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "_UserWines_B_index" ON "public"."_UserWines"("B");

-- AddForeignKey
ALTER TABLE "public"."_UserWines" ADD CONSTRAINT "_UserWines_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserWines" ADD CONSTRAINT "_UserWines_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Wine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
