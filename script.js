document
  .getElementById("dataForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const selectedOption = document.getElementById("dataSelect").value;
    fetchDataAndDrawChart(selectedOption);
  });

async function fetchDataAndDrawChart(option) {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/DigitalControlRoom/dcr-javascript-test/main/data/countries.json"
    );
    const countries = await response.json();
    let processedData = [];
    if (option.includes("region")) {
      processedData = processRegionData(countries, option);
    } else {
      processedData = processCountryData(countries, option);
    }
    drawChart(processedData);
  } catch (error) {
    console.error("Error fetching or processing data:", error);
  }
}

function processCountryData(countries, option) {
  return countries.map((country) => {
    let value = 0;
    switch (option) {
      case "population":
        value = country.population;
        break;
      case "borders":
        value = country.borders.length;
        break;
      case "timezones":
        value = country.timezones.length;
        break;
      case "languages":
        value = country.languages.length;
        break;
      default:
        value = 0;
    }
    return { name: country.alpha3Code, value: value, fullName: country.name };
  });
}

function processRegionData(countries, option) {
  const regionMap = {};
  countries.forEach((country) => {
    const region = country.region;
    if (!regionMap[region]) {
      regionMap[region] = {
        name: region,
        countries: new Set(),
        timezones: new Set(),
      };
    }
    regionMap[region].countries.add(country.name);
    country.timezones.forEach((tz) => regionMap[region].timezones.add(tz));
  });

  return Object.values(regionMap).map((region) => {
    return {
      name: region.name,
      value:
        option === "regionCountries"
          ? region.countries.size
          : region.timezones.size,
    };
  });
}

function drawChart(data) {
  const width = 1920;
  const height = 2000;
  const svg = d3
    .select("#chart")
    .html("")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const maxSize = d3.max(data, (d) => d.value);
  const sizeScale = d3.scaleSqrt().domain([0, maxSize]).range([10, 100]);

  const nodes = data.map((d) => ({ ...d, radius: sizeScale(d.value) }));
  const simulation = d3
    .forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(5))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force(
      "collision",
      d3.forceCollide().radius((d) => d.radius)
    )
    .on("tick", ticked);

  const tooltip = d3.select("#tooltip");

  function ticked() {
    const node = svg
      .selectAll(".node")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`);

    node
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", "#000")
      .attr("stroke", "#fff")
      .on("mouseover", function (event, d) {
        tooltip
          .style("visibility", "visible")
          .html(`Name: ${d.name}<br/>Value: ${d.value}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`);
      })
      .on("mouseout", function () {
        tooltip.style("visibility", "hidden");
      });

    const text = node
      .append("text")
      .attr("text-anchor", "middle")
      .style("fill", "white")
      .style("font-size", (d) => Math.max(12, d.radius / 5))
      .style("pointer-events", "none");

    text
      .append("tspan")
      .attr("x", 0)
      .attr("dy", "-0.6em")
      .text((d) => d.name);

    text
      .append("tspan")
      .attr("x", 0)
      .attr("dy", "1.2em")
      .text((d) => `${d.value}`);
  }

  updateDataTable(data);
}

function updateDataTable(data) {
  const tbody = document.querySelector("#dataTable tbody");
  tbody.innerHTML = ""; // Clear existing rows

  data.forEach((item) => {
    const row = tbody.insertRow();
    const nameCell = row.insertCell();
    nameCell.textContent = item.name;
    const valueCell = row.insertCell();
    valueCell.textContent = item.value;
  });
}
