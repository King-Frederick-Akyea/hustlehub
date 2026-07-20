import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

// Screens are nested across a Root stack -> Auth/Verification/Main stacks -> Main tabs,
// and navigate freely across those boundaries (e.g. a tab screen pushing a stack-only
// route like "Notifications"). A single flattened param list keeps every screen's
// navigation/route props type-safe without fighting composite navigator generics.
export type RootStackParamList = {
  // Root
  OnboardingFlow: undefined;
  Auth: undefined;
  Verification: undefined;
  Main: undefined;

  // Auth stack
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email?: string; devToken?: string } | undefined;

  // Verification stack
  EmailVerification: undefined;
  StudentIDUpload: undefined;
  FaceVerification: undefined;
  VerificationSuccess: undefined;

  // Main stack
  MainTabs: undefined;
  CreateTask: undefined;
  TaskDetails: { taskId: string };
  ActiveTask: { taskId?: string } | undefined;
  Notifications: undefined;
  Wallet: undefined;
  Rentals: undefined;
  Messages: undefined;
  ChatDetail: { conversationId: string };
  EditProfile: undefined;
  MyTasks: undefined;
  Bookmarks: undefined;
  CreateListing: undefined;
  ListingDetails: { listingId: string };

  // Main tabs
  HomeTab: undefined;
  SearchTab: undefined;
  PostTab: undefined;
  MessagesScreen: undefined;
  MyTasksScreen: undefined;
  ProfileTab: undefined;
};

// Every screen ultimately sits under a Stack navigator (Auth/Verification/Main), even ones
// nested a level deeper inside the Main tab navigator, so StackNavigationProp (which adds
// replace/push/pop on top of the base navigate/goBack) accurately describes what's available.
export type ScreenNavigationProp<RouteName extends keyof RootStackParamList> = StackNavigationProp<
  RootStackParamList,
  RouteName
>;

export type ScreenRouteProp<RouteName extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  RouteName
>;

export type ScreenProps<RouteName extends keyof RootStackParamList> = {
  navigation: ScreenNavigationProp<RouteName>;
  route: ScreenRouteProp<RouteName>;
};
