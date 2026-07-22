import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

type BackCapableNavigation = {
  canGoBack: () => boolean;
  goBack: () => void;
};

/**
 * Wraps `navigation.goBack()` for screens in the verification stack (email/ID/face), which can
 * each be the stack's initial route depending on where `resumeRouteFor` resumes the user - so
 * "back" has nothing to pop to and the raw call throws the GO_BACK-not-handled warning. Falls
 * back to logging out (with confirmation) in that case, since abandoning a mandatory,
 * server-tracked verification flow and returning to the Auth stack is the only sane "back" out
 * of it - the user's progress resumes correctly next time they sign in.
 */
export function useSafeGoBack(navigation: BackCapableNavigation): () => void {
  const { logout } = useAuth();

  return () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      'Exit verification?',
      "You'll be logged out. You can pick up where you left off next time you sign in.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => logout() },
      ]
    );
  };
}
