declare namespace FifaApi {
  interface TypeLocalized {
    Locale: string;
    Description: string;
  }

  interface Weather {
    Humidity: string;
    Temperature: string;
    WindSpeed: string;
    Type: number;
    TypeLocalized: TypeLocalized[];
  }

  interface StageName {
    Locale: string;
    Description: string;
  }

  interface GroupName {
    Locale: string;
    Description: string;
  }

  interface CompetitionName {
    Locale: string;
    Description: string;
  }

  interface TeamName {
    Locale: string;
    Description: string;
  }

  interface Home {
    Score?: number;
    Side?: any;
    IdTeam: string;
    PictureUrl: string;
    IdCountry: string;
    Tactics: string;
    TeamType: number;
    AgeType: number;
    TeamName: TeamName[];
    FootballType: number;
    Gender: number;
  }

  interface TeamName2 {
    Locale: string;
    Description: string;
  }

  interface Away {
    Score?: number;
    Side?: any;
    IdTeam: string;
    PictureUrl: string;
    IdCountry: string;
    Tactics: string;
    TeamType: number;
    AgeType: number;
    TeamName: TeamName2[];
    FootballType: number;
    Gender: number;
  }

  interface Name {
    Locale: string;
    Description: string;
  }

  interface CityName {
    Locale: string;
    Description: string;
  }

  interface Properties {
    IdCBS: string;
    IdIFES: string;
  }

  interface Stadium {
    IdStadium: string;
    Name: Name[];
    Capacity?: any;
    WebAddress?: any;
    Built?: any;
    Roof: boolean;
    Turf?: any;
    IdCity: string;
    CityName: CityName[];
    IdCountry: string;
    PostalCode?: any;
    Street?: any;
    Email?: any;
    Fax?: any;
    Phone?: any;
    AffiliationCountry?: any;
    AffiliationRegion?: any;
    Latitude?: any;
    Longitude?: any;
    Length?: any;
    Width?: any;
    Properties: Properties;
    IsUpdateable?: any;
  }

  interface BallPossession {
    Intervals: any[];
    LastX: any[];
    OverallHome: number;
    OverallAway: number;
  }

  interface NameShort {
    Locale: string;
    Description: string;
  }

  interface Name2 {
    Locale: string;
    Description: string;
  }

  interface TypeLocalized2 {
    Locale: string;
    Description: string;
  }

  interface Official {
    IdCountry: string;
    OfficialId: string;
    NameShort: NameShort[];
    Name: Name2[];
    OfficialType: number;
    TypeLocalized: TypeLocalized2[];
  }

  interface Properties2 {
    IdCBS: string;
    IdIFES: string;
  }

  interface Result {
    IdCompetition: string;
    IdSeason: string;
    IdStage: string;
    IdGroup: string;
    Weather: Weather;
    Attendance: string;
    IdMatch: string;
    MatchDay: string;
    StageName: StageName[];
    GroupName: GroupName[];
    CompetitionName: CompetitionName[];
    Date: string;
    LocalDate: string;
    Home: Home;
    Away: Away;
    HomeTeamScore?: number;
    AwayTeamScore?: number;
    AggregateHomeTeamScore?: number;
    AggregateAwayTeamScore?: number;
    HomeTeamPenaltyScore?: number;
    AwayTeamPenaltyScore?: number;
    LastPeriodUpdate?: any;
    Leg?: any;
    IsHomeMatch?: any;
    Stadium: Stadium;
    IsTicketSalesAllowed?: any;
    MatchTime: string;
    SecondHalfTime?: any;
    FirstHalfTime?: any;
    FirstHalfExtraTime?: any;
    SecondHalfExtraTime?: any;
    Winner: string;
    MatchReportUrl?: any;
    PlaceHolderA: string;
    PlaceHolderB: string;
    BallPossession: BallPossession;
    Officials: Official[];
    MatchStatus: number;
    ResultType: number;
    MatchNumber: number;
    TimeDefined: boolean;
    OfficialityStatus: number;
    Properties: Properties2;
    IsUpdateable?: any;
  }

  interface RootObject {
    ContinuationToken?: any;
    ContinuationHash?: any;
    Results: Result[];
  }
}
