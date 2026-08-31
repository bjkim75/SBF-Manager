// Feature: horizontal-tab-navigation
// ts-ext-resolver.mjs의 resolve 훅을 module.register로 등록하는 진입점.
// --import 로 프리로드하여 확장자 없는 상대 .ts import를 해석하게 한다.
import { register } from "node:module";
register("./ts-ext-resolver.mjs", import.meta.url);
