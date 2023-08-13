import express from "express";
import axios from "axios";
import cheerio from "cheerio";

const app = express();
const port = 3000;

app.use(express.json());

const baseUrl = "https://www.arukereso.hu/CategorySearch.php?st=";

function extractPriceFromString(input: string): number | string {
  const match = input.match(/\d+(?: \d{3})*(?=\sFt)/);
  if (match) {
    return parseInt(match[0].replace(/ /g, ""), 10);
  }
  return input;
}

app.get("/scrape", async (req, res) => {
  try {
    const searchTerm = req.query.s as string;
    const pageInput = req.query.p as string;
    let pageNumber: number = 0;
    if (pageInput) {
      pageNumber = parseInt(pageInput) * 20;
    }

    if (!searchTerm) {
      return res.status(400).json({ error: "Missing search term" });
    }

    const url =
      baseUrl + encodeURIComponent(searchTerm) + "&start=" + pageNumber;
    const response = await axios.get(url);
    const html = response.data;

    const $ = cheerio.load(html);
    const targetDiv = $("div.col-lg-12.breadcrumb-field a");
    const category = targetDiv.last().text();
    const products: any[] = [];

    const productContainers = $("div.product-box-container");

    productContainers.each((index, productContainer) => {
      const productName = $(productContainer).find(".name h2 a").text().trim();
      const productPrice = $(productContainer).find(".price").text().trim();
      const price = extractPriceFromString(productPrice);
      products.push({
        name: productName.replace(category, "").trim(),
        price: price,
      });
    });

    res.json(products);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
