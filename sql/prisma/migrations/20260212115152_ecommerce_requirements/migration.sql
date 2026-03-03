-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'electronics',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "inStock" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "popularity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_inStock_idx" ON "Product"("inStock");

-- CreateIndex
CREATE INDEX "Product_rating_idx" ON "Product"("rating");

-- CreateIndex
CREATE INDEX "Product_popularity_idx" ON "Product"("popularity");
