import players from "./files";
import * as FifaApi from "./fifa-api";

export type MatchWinner = "home" | "away" | "tie";

export enum MatchPredictionResult {
  fail = 0,
  resultOk = 3,
  scoreOk = 5,
}

export interface MatchPrediction {
  matchNumber: string;
  homeScore: number;
  awayScore: number;
  result: MatchPredictionResult;
}

export interface PlayerData {
  playerId: string;
  name: string;
  matchesScore: number;
  groupsScores: GroupScoreData;
  bestGoalscorerScore: number;
  totalScore: number;
  matches: Record<string, MatchPrediction>;
  groups: Record<string, FifaApi.GroupRankingData[]>;
}

export interface RankData {
  points: number;
  players: string[];
}

const getMatchWinner = (scoreHome: number, scoreAway: number): MatchWinner => {
  if (scoreHome > scoreAway) return "home";
  if (scoreHome < scoreAway) return "away";
  return "tie";
};

const getPredictionResult = (
  scoreHome: number,
  scoreAway: number,
  pScoreHome: number,
  pScoreAway: number
): MatchPredictionResult => {
  if (scoreHome === pScoreHome && scoreAway === pScoreAway) {
    return MatchPredictionResult.scoreOk;
  }

  const winner = getMatchWinner(scoreHome, scoreAway);
  const pWinner = getMatchWinner(pScoreHome, pScoreAway);
  if (winner === pWinner) {
    return MatchPredictionResult.resultOk;
  }

  return MatchPredictionResult.fail;
};

const sumArray = (values: number[]): number => {
  return values.reduce((a, b) => a + b, 0);
};

function buildData({ groups, matches, teams }: FifaApi.TournamentData) {
  const playersData: Record<string, PlayerData> = {};

  for (const playerId of Object.keys(players)) {
    const predictions = players[playerId];
    const predictionMap: Record<string, MatchPrediction> = {};

    for (const matchId of Object.keys(matches)) {
      const match = matches[matchId];
      const prediction = predictions.find(
        (p) => p.match_id.toString() === match.matchNumber
      );

      if (prediction === undefined) continue;

      predictionMap[matchId] = {
        matchNumber: match.matchNumber,
        homeScore: prediction.score_h,
        awayScore: prediction.score_a,
        result: getPredictionResult(
          match.home.score,
          match.away.score,
          prediction.score_h,
          prediction.score_a
        ),
      };
    }

    const pGroupRankings = FifaApi.buildGroupRankings(
      groups,
      matches,
      predictionMap
    );

    const matchesScore = sumArray(
      Object.keys(predictionMap)
        .map((matchId) => predictionMap[matchId])
        .map((p) => p.result)
    );

    const groupsScores = computeGroupsScore(groups, pGroupRankings);
    const bestGoalscorerScore =
      ["Antoine", "Remy"].indexOf(playerId) !== -1 ? 3 : 0;

    playersData[playerId] = {
      playerId,
      name: playerId.replace("_", " "),
      matches: predictionMap,
      groups: pGroupRankings,
      matchesScore,
      groupsScores,
      bestGoalscorerScore,
      totalScore: matchesScore + groupsScores.score + bestGoalscorerScore,
    };
  }

  const rankingsMap: { [points: number]: string[] } = {};
  for (const playerId of Object.keys(playersData)) {
    const player = playersData[playerId];
    const rank = rankingsMap[player.totalScore] || [];
    rank.push(playerId);
    rankingsMap[player.totalScore] = rank;
  }

  const playerRankings = Object.keys(rankingsMap)
    .map(
      (points): RankData => ({
        points: parseInt(points, 10),
        players: rankingsMap[parseInt(points, 10)],
      })
    )
    .sort((a, b) => b.points - a.points);

  return { groups, matches, teams, players: playersData, playerRankings };
}

export default async function getData() {
  return buildData(await FifaApi.fetchTournamentData());
}

export type Data = ReturnType<typeof buildData>;

export enum GroupPredictionResult {
  fail = 0,
  qualifiedWrongOrder = 1,
  qualifiedRightOrder = 3,
  perfect = 5,
}

function computeGroupsScore(
  groups: FifaApi.GroupsMap,
  pGroupRankings: FifaApi.GroupRankingsMap
) {
  const groupsScore: Record<string, GroupPredictionResult> = {};
  let score = 0;

  for (const groupId of Object.keys(groups)) {
    const group = groups[groupId];
    const pGroup = pGroupRankings[groupId];

    if (isPerfectGroupPrediction(group.teamRankings, pGroup)) {
      score += GroupPredictionResult.perfect;
      groupsScore[groupId] = GroupPredictionResult.perfect;
    } else if (
      isQualifiedRightOrderGroupPrediction(group.teamRankings, pGroup)
    ) {
      score += GroupPredictionResult.qualifiedRightOrder;
      groupsScore[groupId] = GroupPredictionResult.qualifiedRightOrder;
    } else if (
      isQualifiedWrongOrderGroupPrediction(group.teamRankings, pGroup)
    ) {
      score += GroupPredictionResult.qualifiedWrongOrder;
      groupsScore[groupId] = GroupPredictionResult.qualifiedWrongOrder;
    } else {
      score += GroupPredictionResult.fail;
      groupsScore[groupId] = GroupPredictionResult.fail;
    }
  }

  return { groupsScore, score };
}

export type GroupScoreData = ReturnType<typeof computeGroupsScore>;

function isPerfectGroupPrediction(
  correct: FifaApi.GroupRankingData[],
  predictions: FifaApi.GroupRankingData[]
) {
  for (let i = 0; i < 4; i++) {
    const ranking = correct[i];
    const pRanking = predictions[i];
    if (ranking.teamId !== pRanking.teamId) return false;
  }
  return true;
}

function isQualifiedRightOrderGroupPrediction(
  correct: FifaApi.GroupRankingData[],
  predictions: FifaApi.GroupRankingData[]
) {
  const [a, b] = [correct[0].teamId, correct[1].teamId];
  const [x, y] = [predictions[0].teamId, predictions[1].teamId];
  return a === x && b === y;
}

function isQualifiedWrongOrderGroupPrediction(
  correct: FifaApi.GroupRankingData[],
  predictions: FifaApi.GroupRankingData[]
) {
  const [a, b] = [correct[0].teamId, correct[1].teamId];
  const [x, y] = [predictions[0].teamId, predictions[1].teamId];
  return a === y && b === x;
}
