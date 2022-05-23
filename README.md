# Weird template engine 👉👈
## Performance benchmark 🔥

- [renderTemplate](https://github.com/Aiko-Suzuki/nnt-template/blob/main/src/render.ts#L110)
- [handlebars](https://handlebarsjs.com/)

![benchmark](https://user-images.githubusercontent.com/42787030/169732537-abb9ddbc-f4f0-4b37-9e60-8e40232661dd.png)
## How to use
```js
// Deno example : https://deno.land/
import {compile} from "https://cdn.jsdelivr.net/gh/Aiko-Suzuki/nnt-template@main/bundle.js"
const template = Deno.readTextFileSync("bench/test.nnt");
const compiled = compile(template)

const data = {
  title: "Test Title 1",
  slug: "test-title-1",
  id: 1,
  type: "TV",
  startdate: "2020-01-01",
  visible: true,
}

const result = compiled(data);
console.log(result )
```
## Helper
```js
registerHelper("json",(data) => {
  return JSON.stringify(data)
})
```

## supported block
- **if** 🟢
- **foreach** 🟢
- **elseif** 🔴
