/*
  Warnings:

  - Added the required column `brand` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "availability" TEXT NOT NULL DEFAULT 'in_stock',
ADD COLUMN     "brand" TEXT NOT NULL,
ADD COLUMN     "imageUrl" TEXT;

-- CreateIndex
CREATE INDEX "Product_brand_idx" ON "Product"("brand");

-- CreateIndex
CREATE INDEX "Product_availability_idx" ON "Product"("availability");
