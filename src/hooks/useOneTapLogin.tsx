"use client";

import googleOneTap from "google-one-tap";
import { signIn } from "next-auth/react";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function () {
  const { data: session, status } = useSession();

  const oneTapLogin = async function () {
    // 检查必需的配置
    if (!process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID) {
      console.warn("Google One Tap: missing NEXT_PUBLIC_AUTH_GOOGLE_ID");
      return;
    }

    const options = {
      client_id: process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID,
      auto_select: false,
      cancel_on_tap_outside: false,
      context: "signin",
    };

    try {
      googleOneTap(options, (response: any) => {
        if (response?.credential) {
          console.log("onetap login ok", response);
          handleLogin(response.credential);
        } else {
          console.warn("Google One Tap: invalid response", response);
        }
      });
    } catch (error) {
      console.error("Google One Tap error:", error);
    }
  };

  const handleLogin = async function (credentials: string) {
    try {
      const res = await signIn("google-one-tap", {
        credential: credentials,
        redirect: false,
      });
      
      if (res?.ok) {
        console.log("Google One Tap signIn success", res);
      } else {
        console.error("Google One Tap signIn failed", res?.error);
      }
    } catch (error) {
      console.error("Google One Tap handleLogin error:", error);
    }
  };

  useEffect(() => {
    // console.log("one tap login status", status, session);

    if (status === "unauthenticated") {
      // 首次尝试
      oneTapLogin();

      // 增加重试间隔，减少频繁弹出
      // 只在首次失败后重试一次，间隔30秒
      const timeoutId = setTimeout(() => {
        oneTapLogin();
      }, 30000);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [status]);

  return <></>;
}
