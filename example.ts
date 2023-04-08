import { compile, registerLayout } from "./mod.ts";
const template = Deno.readTextFileSync("./layouts.nnt");
registerLayout(
	"header",
	`<h3>{{title}}</h3><span>ID : {{id}}, SLUG : {{slug}}</span>`,
);
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
