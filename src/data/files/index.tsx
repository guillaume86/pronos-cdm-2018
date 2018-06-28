import Antoine from "./Antoine.json";
import Boris from "./Boris.json";
import Chris from "./Chris.json";
import Francois_Collart from "./Francois Collart.json";
import Francois_Mary from "./Francois Mary.json";
import Guillaume from "./Guillaume.json";
import Harold from "./Harold.json";
import Mathieu from "./Mathieu.json";
import Quentin from "./Quentin.json";
import Remy from "./Remy.json";
import Seb from "./Seb.json";
import Stephano from "./Stephano.json";
import Thomas from "./Thomas.json";

export interface Prediction {
  match_id: number;
  score_h: number;
  score_a: number;
}

const players: Record<string, Prediction[]> = {
  Antoine,
  Boris,
  Chris,
  Francois_Collart,
  Francois_Mary,
  Guillaume,
  Harold,
  Mathieu,
  Quentin,
  Remy,
  Seb,
  Stephano,
  Thomas,
};

export default players;
