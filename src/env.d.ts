/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: import("better-auth/types").User | null;
    session: import("better-auth/types").Session | null;
  }
}
