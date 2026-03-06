-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'electronics',
    "brand" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cpuBrand" TEXT NOT NULL,
    "cpu" TEXT NOT NULL,
    "ram" INTEGER NOT NULL,
    "storage" INTEGER NOT NULL,
    "gpuBrand" TEXT NOT NULL,
    "gpu" TEXT NOT NULL,
    "screen" REAL NOT NULL,
    "price" INTEGER NOT NULL,
    "availability" TEXT NOT NULL DEFAULT 'in_stock',
    "rating" REAL NOT NULL DEFAULT 0,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_brand_idx" ON "Product"("brand");

-- CreateIndex
CREATE INDEX "Product_type_idx" ON "Product"("type");

-- CreateIndex
CREATE INDEX "Product_cpuBrand_idx" ON "Product"("cpuBrand");

-- CreateIndex
CREATE INDEX "Product_gpuBrand_idx" ON "Product"("gpuBrand");

-- CreateIndex
CREATE INDEX "Product_ram_idx" ON "Product"("ram");

-- CreateIndex
CREATE INDEX "Product_storage_idx" ON "Product"("storage");

-- CreateIndex
CREATE INDEX "Product_price_idx" ON "Product"("price");

-- CreateIndex
CREATE INDEX "Product_screen_idx" ON "Product"("screen");

-- CreateIndex
CREATE INDEX "Product_availability_idx" ON "Product"("availability");

-- CreateIndex
CREATE INDEX "Product_inStock_idx" ON "Product"("inStock");

-- CreateIndex
CREATE INDEX "Product_rating_idx" ON "Product"("rating");

-- CreateIndex
CREATE INDEX "Product_popularity_idx" ON "Product"("popularity");

-- CreateIndex
CREATE UNIQUE INDEX "Product_brand_name_key" ON "Product"("brand", "name");
