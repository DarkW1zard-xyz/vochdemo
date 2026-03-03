-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cpuBrand" TEXT NOT NULL,
    "cpu" TEXT NOT NULL,
    "ram" INTEGER NOT NULL,
    "storage" INTEGER NOT NULL,
    "gpuBrand" TEXT NOT NULL,
    "gpu" TEXT NOT NULL,
    "screen" DOUBLE PRECISION NOT NULL,
    "price" INTEGER NOT NULL,
    "tags" TEXT[],
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

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
