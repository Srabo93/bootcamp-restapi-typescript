import NodeGeocoder, { Options } from "node-geocoder";
import { GEOCODER_API_KEY } from "../config/config";

const options: Options = {
  provider: "mapquest",
  apiKey: GEOCODER_API_KEY,
  formatter: null,
};

const geocoder = NodeGeocoder(options);

export default geocoder;
