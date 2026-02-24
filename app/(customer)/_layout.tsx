import { Stack } from "expo-router";

export default function CustomerLayout() {
  return (
   <Stack screenOptions={{ headerShown: false }}>

      <Stack.Screen
        name="Home"
        options={{
          title: "Home",
        }}
      />

      <Stack.Screen
        name="Services"
        options={{
          title: "Services Screen",
        }}
      />


        <Stack.Screen
        name="ServiceDetails"
        options={{
          title: "Service Details Screen",
        }}
      />


        <Stack.Screen
        name="LocationDetails"
        options={{
          title: "location details Screen",
        }}
      />
      
      <Stack.Screen
        name="FindingProvider"
        options={{
          title: "finding provider Screen",
        }}
      />


    </Stack>
  );
}
