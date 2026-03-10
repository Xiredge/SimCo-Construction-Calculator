import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const urls = [
  "https://www.simcompanies.com/api/v3/market/0/101/", //Reinforced concrete
  "https://www.simcompanies.com/api/v3/market/0/102/", //Bricks
  "https://www.simcompanies.com/api/v3/market/0/111/", //Construction units
  "https://www.simcompanies.com/api/v3/market/0/108/", //Planks
];

// Fetches the market data from the Sim Companies API and saves it as JSON files in the public folder. 
// This is done every 5 minutes to ensure that the prices are up to date when users access the website.
async function fetchAndSave() {
  try {
    console.log("Fetching market data:", new Date().toISOString());

    const publicPath = path.join(__dirname, "public");

    // Ensure public folder exists
    await fs.promises.mkdir(publicPath, { recursive: true });

    await Promise.all(
      urls.map(async (url) => {
        const response = await fetch(url);
        const data = await response.json();

        const id = url.split("/").filter(Boolean).pop();

        const filePath = path.join(publicPath, `market_${id}.json`);

        await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));

        console.log(`Saved market_${id}.json`);
      }),
    );

    console.log("All files updated.\n");
  } catch (error) {
    console.error("Error fetching market:", error);
  }
}

// Run once at startup
fetchAndSave();

// Run every 10 minutes, format is in milliseconds, so 10 minutes = 10 * 60 * 1000 ms
setInterval(fetchAndSave, 10 * 60 * 1000);

// For reading and opening a JSON file
function readJSONFile(filePath, log=false) {
  const data = JSON.parse(
    fs.readFileSync(filePath, "utf8"),
  );

  if(log){
    console.log("Loaded JSON:", data);
  }

  return data;
}

app.get("/", (req, res) => {
  const materials = readJSONFile("public/buildingMaterials.json");
  const reinforcedConcretePriceData = readJSONFile("public/market_101.json");
  const bricksPriceData = readJSONFile("public/market_102.json");
  const planksPriceData = readJSONFile("public/market_108.json");
  const constructionUnitsPriceData = readJSONFile("public/market_111.json");

  res.render("index.ejs", {
    reinforcedConcretePrice: reinforcedConcretePriceData[0].price,
    bricksPrice: bricksPriceData[0].price,
    planksPrice: planksPriceData[0].price,
    constructionUnitsPrice: constructionUnitsPriceData[0].price,
    level: 1,
  });
});

app.post("/calculate", (req, res) => {
	// Reads the JSON files and stores the data in variables.
  const materials = readJSONFile("public/buildingMaterials.json");
	const reinforcedConcretePriceData = readJSONFile("public/market_101.json");
	const bricksPriceData = readJSONFile("public/market_102.json");
	const planksPriceData = readJSONFile("public/market_108.json");
	const constructionUnitsPriceData = readJSONFile("public/market_111.json");

	const buildings = req.body.selected_building;
    let level = req.body.level;

	// Subtracts 1 level from the input level, since the material required only increases after level 2.
	// So basically, level 1 and 2 has the same amount of materials, level 3 and above has the base amount + 1 level increase.
	if(level > 1){
		level -= 1;
	}

	// Declares the amount of materials needed for the selected building and level. The amount increases by the base amount for each level after level 1.
	const reinforcedConcreteAmount = materials[buildings].reinforcedConcrete * level;
	const bricksAmount = materials[buildings].bricks * level;
	const planksAmount = materials[buildings].planks * level;
	const constructionUnitsAmount = materials[buildings].constructionUnits * level;

	// Declares the price of material per piece.
	const reinforcedConcretePrice = reinforcedConcretePriceData[0].price;
	const bricksPrice = bricksPriceData[0].price;
	const planksPrice = planksPriceData[0].price;
	const constructionUnitsPrice = constructionUnitsPriceData[0].price;

	// Calculates the total cost for each material and the grand total.
	const reinforcedConcreteTotal = Math.round(reinforcedConcreteAmount * reinforcedConcretePrice);
	const bricksTotal = Math.round(bricksAmount * bricksPrice);
	const planksTotal = Math.round(planksAmount * planksPrice);
	const constructionUnitsTotal = Math.round(constructionUnitsAmount * constructionUnitsPrice);
	const grandTotal = reinforcedConcreteTotal + bricksTotal + planksTotal + constructionUnitsTotal;

	// Renders the index.ejs file and passes the calculated values as variables to be displayed on the index.ejs.
  res.render("index.ejs", {
		reinforcedConcreteAmount: reinforcedConcreteAmount,
		bricksAmount: bricksAmount,
		planksAmount: planksAmount,
		constructionUnitsAmount: constructionUnitsAmount,
		reinforcedConcretePrice: reinforcedConcretePrice,
		bricksPrice: bricksPrice,
		planksPrice: planksPrice,
		constructionUnitsPrice: constructionUnitsPrice,
		reinforcedConcreteTotal: reinforcedConcreteTotal,
		bricksTotal: bricksTotal,
		planksTotal: planksTotal,
		constructionUnitsTotal: constructionUnitsTotal,
		grandTotal: grandTotal,
		buildings: buildings,
		level: req.body.level,
  });
});


// Starts the server and listens on the specified port.
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
