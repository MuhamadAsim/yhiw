import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
   <Stack screenOptions={{ headerShown: false }}>

      <Stack.Screen
        name="customer_signin"
        options={{
          title: "Sign In",
        }}
      />

      <Stack.Screen
        name="customer_signup"
        options={{
          title: "Create Account",
        }}
      />

       <Stack.Screen
        name="provider_signin"
        options={{
          title: "Sign In",
        }}
      />

      <Stack.Screen
        name="provider_signup"
        options={{
          title: "Create Account",
        }}
      />
     <Stack.Screen name="role_selection" />

    </Stack>
  );
}
