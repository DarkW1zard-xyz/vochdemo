/*
  Warnings:

  - A unique constraint covering the columns `[brand,name]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Product_brand_name_key" ON "Product"("brand", "name");
