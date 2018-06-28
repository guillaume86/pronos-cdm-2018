const API_URL =
  "https://api.fifa.com/api/v1/calendar/matches?idseason=254645&idcompetition=17&language=en-GB&count=100";

export interface TeamData {
  teamId: string;
  groupId: string;
  teamName: string;
}

export interface MatchTeamData {
  teamId: string;
  score: number;
  groupPoints: number;
}

export interface MatchData {
  matchNumber: string;
  datetime: Date;
  home: MatchTeamData;
  away: MatchTeamData;
  hasStarted: boolean;
  hasFinished: boolean;
  playingSoon: boolean;
}

export interface GroupData {
  groupId: string;
  groupName: string;
  teamIds: string[];
  matchNumbers: string[];
  teamRankings: GroupRankingData[];
}

export interface GroupRankingData {
  teamId: string;
  gamesPlayed: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
}

export type PredictionMap = Record<
  string,
  { homeScore: number; awayScore: number }
>;

const rankingComparer = (a: GroupRankingData, b: GroupRankingData): number => {
  if (a.points > b.points) return -1;
  if (a.points < b.points) return 1;
  if (a.goalsDiff > b.goalsDiff) return -1;
  if (a.goalsDiff < b.goalsDiff) return 1;
  if (a.goalsFor > b.goalsFor) return -1;
  if (a.goalsFor < b.goalsFor) return 1;
  return 0; // TODO? tie breaker rules: http://www.livescore.com/worldcup/rules/
};

const sumArray = (values: number[]): number => {
  return values.reduce((a, b) => a + b, 0);
};

export type GroupsMap = Record<string, GroupData>;
export type TeamsMap = Record<string, TeamData>;
export type MatchesMap = Record<string, MatchData>;

function buildTournamentData(root: FifaApi.RootObject) {
  const groups: GroupsMap = {};
  const teams: TeamsMap = {};
  const matches: MatchesMap = {};

  for (const match of root.Results) {
    const groupId = match.IdGroup;
    if (groupId === null) continue;

    let group = groups[groupId];
    if (group === undefined) {
      groups[groupId] = group = {
        groupId: match.IdGroup,
        groupName: match.GroupName[0].Description,
        teamIds: [],
        matchNumbers: [],
        teamRankings: [],
      };
    }

    const matchNumber = match.MatchNumber.toString();
    group.matchNumbers.push(matchNumber);

    const homeTeamId = match.Home.IdTeam;
    const awayTeamId = match.Away.IdTeam;
    if (group.teamIds.indexOf(homeTeamId) === -1) {
      group.teamIds.push(homeTeamId);
    }
    if (group.teamIds.indexOf(awayTeamId) === -1) {
      group.teamIds.push(awayTeamId);
    }

    for (const team of [match.Home, match.Away]) {
      if (teams[team.IdTeam]) continue;
      teams[team.IdTeam] = {
        teamId: team.IdTeam,
        groupId,
        teamName: team.TeamName[0].Description,
      };
    }

    const matchData = {
      matchNumber,
      datetime: new Date(match.LocalDate),
      home: {
        teamId: homeTeamId,
        score: match.Home.Score || 0,
        groupPoints: 0,
      },
      away: {
        teamId: awayTeamId,
        score: match.Away.Score || 0,
        groupPoints: 0,
      },
      hasStarted: match.MatchStatus === 0 || match.MatchStatus === 3,
      hasFinished: match.MatchStatus === 0,
      playingSoon: match.MatchStatus === 12,
    } as MatchData;

    matches[matchNumber] = matchData;

    if (matchData.hasStarted) {
      if (matchData.home.score > matchData.away.score) {
        matchData.home.groupPoints = 3;
      } else if (matchData.home.score < matchData.away.score) {
        matchData.away.groupPoints = 3;
      } else {
        matchData.home.groupPoints = 1;
        matchData.away.groupPoints = 1;
      }
    }
  }

  // build group rankings
  const groupRankings = buildGroupRankings(groups, matches);
  for (const groupId of Object.keys(groups)) {
    groups[groupId].teamRankings = groupRankings[groupId];
  }

  return { groups, matches, teams };
}

export type TournamentData = ReturnType<typeof buildTournamentData>;

export async function fetchTournamentData() {
  const res = await fetch(API_URL, {
    headers: {
      pragma: "no-cache",
      "Cache-Control": "no-cache",
    },
  });
  const data: FifaApi.RootObject = await res.json();
  return buildTournamentData(data);
}

function getGroupPoints(score: number, opponentScore: number) {
  if (score > opponentScore) return 3;
  if (score < opponentScore) return 0;
  return 1;
}

export type GroupRankingsMap = Record<string, GroupRankingData[]>;

export function buildGroupRankings(
  groups: GroupsMap,
  matches: MatchesMap,
  predictions?: PredictionMap
) {
  const groupsRankings: GroupRankingsMap = {};

  // copy matches and apply predictions
  if (predictions) {
    matches = { ...matches };
    for (const matchId of Object.keys(matches)) {
      const match = matches[matchId];
      const p = predictions[matchId];
      if (!p) continue;
      matches[matchId] = {
        ...match,
        home: {
          ...match.home,
          score: p.homeScore,
          groupPoints: getGroupPoints(p.homeScore, p.awayScore),
        },
        away: {
          ...match.away,
          score: p.awayScore,
          groupPoints: getGroupPoints(p.awayScore, p.homeScore),
        },
      };
    }
  }

  // build group rankings
  for (const groupId of Object.keys(groups)) {
    const rankings: GroupRankingData[] = [];
    const group = groups[groupId];
    const groupMatches = group.matchNumbers
      .map((matchNumber) => matches[matchNumber])
      .filter((match) => match.hasStarted);

    for (const teamId of group.teamIds) {
      const teamMatches = groupMatches.filter(
        (m) => m.home.teamId === teamId || m.away.teamId === teamId
      );

      const teamResults = teamMatches.map((m) => ({
        team: m.home.teamId === teamId ? m.home : m.away,
        opponent: m.home.teamId === teamId ? m.away : m.home,
      }));

      const gamesPlayed = teamMatches.length;
      const points = sumArray(teamResults.map((tr) => tr.team.groupPoints));
      const goalsFor = sumArray(teamResults.map((tr) => tr.team.score));
      const goalsAgainst = sumArray(teamResults.map((tr) => tr.opponent.score));
      const goalsDiff = goalsFor - goalsAgainst;

      rankings.push({
        teamId,
        gamesPlayed,
        points,
        goalsFor,
        goalsAgainst,
        goalsDiff,
      });
    }

    rankings.sort(rankingComparer);
    groupsRankings[groupId] = rankings;
  }

  return groupsRankings;
}
