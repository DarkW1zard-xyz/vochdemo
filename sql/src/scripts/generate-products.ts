import prisma from "../lib/prisma.js";

const COUNT = Number(process.env.GENERATE_COUNT ?? 10000);

const categories = ["computers", "gaming", "office", "electronics"];
const types = ["laptop", "desktop", "mini-pc", "all-in-one"];
const brands = [
  "Aero",
  "GamerX",
  "Creator",
  "Swift",
  "Atlas",
  "OfficeCore",
  "NanoBox",
  "AllView",
  "Lenovo",
  "Dell",
  "HP",
  "Asus",
  "Acer",
  "MSI",
  "Razer",
  "Samsung",
  "LG",
  "Apple"
];
const cpuBrands = ["intel", "amd", "apple"];
const gpus = {
  intel: ["Intel Iris Xe", "Intel UHD"],
  amd: ["Radeon 780M", "Radeon 660M"],
  apple: ["Apple GPU"],
  nvidia: ["NVIDIA RTX 4050", "NVIDIA RTX 4060", "NVIDIA RTX 4070"],
  integrated: ["Integrated Graphics"]
};
const series = ["Pro", "Air", "Ultra", "Studio", "Edge", "Max"];

const pick = <T,>(values: T[]) => values[Math.floor(Math.random() * values.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const makeProduct = (index: number) => {
  const brand = pick(brands);
  const type = pick(types);
  const category = type === "laptop" || type === "desktop" ? pick(categories) : "electronics";
  const cpuBrand = pick(cpuBrands);
  const cpu = cpuBrand === "apple" ? "Apple M3" : cpuBrand === "amd" ? "AMD Ryzen 7 7840U" : "Intel Core i7-13700H";
  const gpuBrand = cpuBrand === "apple" ? "apple" : Math.random() < 0.6 ? "integrated" : "nvidia";
  const gpu = gpuBrand === "nvidia" ? pick(gpus.nvidia) : gpuBrand === "apple" ? pick(gpus.apple) : pick(gpus.integrated);
  const ram = pick([8, 16, 32, 64]);
  const storage = pick([256, 512, 1024, 2048]);
  const screen = type === "desktop" || type === "mini-pc" ? 0 : pick([13.3, 14, 15.6, 16, 17.3, 23.8]);
  const price = type === "desktop" ? randInt(699, 3499) : randInt(499, 2999);
  const availability = Math.random() < 0.85 ? "in_stock" : "preorder";
  const inStock = availability === "in_stock";
  const rating = Math.round((Math.random() * 2 + 3) * 10) / 10;
  const popularity = randInt(0, 1000);

  return {
    name: `${brand} ${pick(series)} ${type} ${index}`,
    description: `Moderns ${type} ar ${cpu} un ${gpu}, piemērots ${category} darbam un izklaidei.`,
    category,
    brand,
    type,
    cpuBrand,
    cpu,
    ram,
    storage,
    gpuBrand,
    gpu,
    screen,
    price,
    availability,
    rating,
    popularity,
    inStock,
    imageUrl: "/images/placeholder.svg",
    tags: [category, type, brand.toLowerCase()],
    url: "#"
  };
};

const main = async () => {
  const products = Array.from({ length: COUNT }, (_, i) => {
    const p = makeProduct(i + 1);
    return { ...p, tags: JSON.stringify(p.tags) };
  });
  await prisma.product.createMany({ data: products });
  console.log(`Generated ${products.length} products.`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
