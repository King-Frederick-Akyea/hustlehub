// react-native-web ships no TypeScript declarations of its own. Only the one export this app
// actually uses (rendering a raw HTML element on web - see components/DateTimeInputRow.tsx) is
// declared here, not the whole library surface.
declare module 'react-native-web' {
  export function unstable_createElement(
    component: string,
    props?: Record<string, unknown>
  ): JSX.Element;
}
