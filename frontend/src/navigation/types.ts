import { WorkoutSummaryData } from '../screens/workout/summary/page';

export interface ExerciseItem {
  id: string | number;
  name?: string;
  bodyPart?: string;
  muscleGroup?: string | { name: string };
  equipment?: string | { name: string };
}

export type RootStackParamList = {
  MainTabs: { screen: string } | undefined;
  WorkoutDetails: { id: string | number };
  DashboardStatistics: undefined;
  DashboardCalendar: undefined;
  RoutineDetails: { id: string | number };
  EditRoutine: { id: string | number };
  CreateRoutine: undefined;
  Workout: { routineId?: string | number; id?: string | number };
  WorkoutSummary: { summaryData?: WorkoutSummaryData; workoutDayId?: string | number };
  ExerciseHistory: { exercise: ExerciseItem };
  Login: undefined;
  SignUp: undefined;
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
