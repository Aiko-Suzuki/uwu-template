# Weird template engine 👉👈
## Performance benchmark 🔥

- [renderTemplate](https://github.com/Aiko-Suzuki/nnt-template/blob/main/src/render.ts#L110)
- [handlebars](https://handlebarsjs.com/)


![benchmark](https://user-images.githubusercontent.com/42787030/169914534-d8139f6a-9ad9-4886-b5a4-754632ab5967.png)


## How to use
```js
// example using deno: https://deno.land/
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
```
## Helper
```js
registerHelper("JSON",(data) => {
  return JSON.stringify(data)
})
// {{JSON users}}

```

### supported block
- **if** 🟢
- **foreach** 🟢
- **elseif** 🟢

### default helper
- escape
- json
