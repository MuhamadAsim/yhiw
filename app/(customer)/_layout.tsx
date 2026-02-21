import { Stack } from "expo-router";

export default function CustomerLayout() {
  return (
   <Stack screenOptions={{ headerShown: false }}>

      <Stack.Screen
        name="home"
        options={{
          title: "Home",
        }}
      />

      <Stack.Screen
        name="services"
        options={{
          title: "Services Screen",
        }}
      />


        <Stack.Screen
        name="servicedetails"
        options={{
          title: "Service Details Screen",
        }}
      />


        <Stack.Screen
        name="locationdetails"
        options={{
          title: "location details Screen",
        }}
      />
      
      <Stack.Screen
        name="findingprovider"
        options={{
          title: "finding provider Screen",
        }}
      />


    </Stack>
  );
}
