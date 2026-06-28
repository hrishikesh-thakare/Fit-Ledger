export type RootStackParamList = {
  MainTabs: undefined;
  WorkoutDetails: { id: string | number };
  RoutineDetails: { id: string | number };
  EditRoutine: { id: string | number };
  CreateRoutine: undefined;
  Workout: { routineId?: string | number; id?: string | number };
  WorkoutSummary: { summaryData?: any; workoutDayId?: string | number };
  ExerciseHistory: { exercise: any };
  Login: undefined;
  SignUp: undefined;
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
