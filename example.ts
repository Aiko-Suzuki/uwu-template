import { compile } from "https://cdn.jsdelivr.net/gh/Aiko-Suzuki/nnt-template@main/bundle.js";
const template = Deno.readTextFileSync("bench/test.nnt");
const compiled = compile(template);

const data = {
	title: "Test Title 1",
	slug: "test-title-1",
	id: 1,
	type: "TV",
	startdate: "2020-01-01",
	visible: true,
};

const result = compiled([data]);
console.log(result);