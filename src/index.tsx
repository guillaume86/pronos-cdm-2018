import * as React from "react";
import * as ReactDOM from "react-dom";
import "./style.css";
import getData, { Data } from "./data";
import { gifs } from "./data/gifs";

const formatScore = (scoreHome: number, scoreAway: number) => {
  return `${scoreHome} - ${scoreAway}`;
};

const getPronoClassName = (points: number | null) => {
  if (points === 0) return "no-points";
  if (points === 3) return "winner-ok";
  if (points === 5) return "score-ok";
  return undefined;
};

const pickRandom = (arr: string[]): string =>
  arr[Math.floor(Math.random() * arr.length)];

const formatWinners = (winners: string[]) => {
  if (winners.length === 1) {
    return `${winners[0]} a pris la tête: `;
  } else {
    const rest = winners.slice(0, -2);
    const lastTwo = winners.slice(-2);
    const endText = lastTwo.join(" et ") + " se partagent la 1ère place: ";
    if (rest.length > 0) {
      return rest.join(", ") + ", " + endText;
    } else {
      return endText;
    }
  }
};

interface MatchViewProps {
  data: Data;
  defaultMatchId: string | undefined;
}

interface MatchViewState {
  matchId: string;
}

class MatchView extends React.Component<MatchViewProps, MatchViewState> {
  constructor(props: MatchViewProps) {
    super(props);
    this.state = { matchId: props.defaultMatchId || "0" };
  }

  render() {
    const { matches, players, teams } = this.props.data;
    const { matchId } = this.state;
    const match = matches[matchId];

    return (
      <div>
        <select
          className="form-control"
          value={matchId}
          onChange={(ev) => this.setState({ matchId: ev.currentTarget.value })}
        >
          <option value={0}>--- select match ---</option>
          {Object.keys(matches).map((mid) => {
            const optionMatch = matches[mid];
            return (
              <option key={mid} value={mid}>
                {optionMatch.matchNumber}.{" "}
                {teams[optionMatch.home.teamId].teamName} -{" "}
                {teams[optionMatch.away.teamId].teamName}
              </option>
            );
          })}
        </select>

        <br />
        <br />

        {matchId !== "0" && (
          <table className="table table-sm table-bordered">
            <tbody>
              <tr>
                <td />
                <td>
                  {match.hasStarted &&
                    formatScore(match.home.score, match.away.score)}
                </td>
              </tr>
              {Object.keys(players).map((playerId) => {
                const player = players[playerId];
                const prono = player.matches[matchId];

                if (!prono) return null;

                return (
                  <tr
                    key={playerId}
                    className={getPronoClassName(prono.result)}
                  >
                    <td>{player.name}</td>
                    <td>{formatScore(prono.homeScore, prono.awayScore)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    );
  }
}

interface AppProps {
  data: Data;
}

class App extends React.Component<AppProps> {
  render() {
    const {
      matches,
      players,
      playerRankings: rankings,
      teams,
    } = this.props.data;
    const winners = rankings && rankings[0].players.map((id) => players[id]);
    const defaultMatchId = Object.keys(matches).find((id) => {
      const match = matches[id];
      return match.hasStarted && !match.hasFinished;
    });

    return (
      <div className="container">
        {rankings && (
          <div>
            <h2>Classement</h2>
            <p>{winners && formatWinners(winners.map((w) => w.name))}</p>
            {winners &&
              winners.map((winner) => (
                <div key={winner.playerId}>
                  <img
                    className="winner img-fluid"
                    src={pickRandom(gifs[winner.playerId])}
                  />
                </div>
              ))}
            <table className="table table-sm table-bordered ranking-table">
              <tbody>
                {rankings.map((rank, index) => (
                  <React.Fragment key={index}>
                    <tr>
                      <td rowSpan={rank.players.length}>{index + 1}</td>
                      <td>
                        <a href={`#${rank.players[0]}`}>
                          {players[rank.players[0]].name}
                        </a>
                      </td>
                      <td>{rank.points}</td>
                    </tr>
                    {rank.players.slice(1).map((playerId) => (
                      <tr key={playerId}>
                        <td>
                          <a href={`#${playerId}`}>{players[playerId].name}</a>
                        </td>
                        <td>{rank.points}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rankings && (
          <div>
            <h2>Vue match</h2>
            <MatchView data={this.props.data} defaultMatchId={defaultMatchId} />
          </div>
        )}
        {Object.keys(players).map((playerId) => {
          const player = players[playerId];
          return (
            <div key={playerId}>
              <h2 id={playerId}>{player.name}</h2>
              <table className="table table-sm table-bordered">
                <tbody>
                  {Object.keys(matches).map((matchId) => {
                    const match = matches[matchId];
                    const prono = player.matches[match.matchNumber];
                    if (!prono) return null;
                    return (
                      <tr
                        key={matchId}
                        className={getPronoClassName(prono.result)}
                      >
                        <td>{match.matchNumber}</td>
                        <td>{match.datetime.toLocaleDateString()}</td>
                        <td>
                          {match.datetime.toLocaleTimeString().substr(0, 5)}
                        </td>
                        <td>{teams[match.home.teamId].teamName}</td>
                        <td className="score-cell">
                          {formatScore(prono.homeScore, prono.awayScore)}
                        </td>
                        <td className="score-cell result-cell">
                          {match.hasStarted &&
                            formatScore(match.home.score, match.away.score)}
                        </td>
                        <td>{teams[match.away.teamId].teamName}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
        {false &&
          Object.keys(gifs).map((x) => (
            <p key={x}>
              {x}
              <img src={gifs[x]} />
            </p>
          ))}
      </div>
    );
  }
}

getData().then((data: Data) => {
  ReactDOM.render(<App data={data} />, document.getElementById("root"));
});

// // update every 1min
// setInterval(() => {
//   getDataWithResults().then((data) => render(data));
// }, 60 * 1000);
