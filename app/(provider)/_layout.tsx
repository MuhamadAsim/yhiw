import { Stack } from "expo-router";

export default function ProviderLayout() {
  return (
   <Stack screenOptions={{ headerShown: false }}>

      <Stack.Screen
        name="Home"
        options={{
          title: "Home",
        }}
      />


      

    </Stack>
  );
}
