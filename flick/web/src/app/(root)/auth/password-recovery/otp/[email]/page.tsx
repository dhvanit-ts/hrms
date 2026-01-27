import { useState, useEffect, useCallback } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import axios, { AxiosError, AxiosResponse } from "axios";
import { toast } from 'sonner'
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { env } from "@/conf/env";

const OTP_EXPIRE_TIME = 60;
const MAX_ATTEMPTS = 5;

const OtpVerificationPage = ({ onVerifiedRedirect, onFailedRedirect }: { onVerifiedRedirect: string, onFailedRedirect: string }) => {
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRE_TIME);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isOtpInvalid, setIsOtpInvalid] = useState(false);

  const { email } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (!email) {
      navigate(onFailedRedirect);
    }
  }, [navigate, email, onFailedRedirect]);

  const handleOtpChange = (newOtp: string) => {
    setOtp(newOtp);
    if (isOtpInvalid) {
      setIsOtpInvalid(false);
    }
  };

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const sendOtp = useCallback(async () => {
    if (!email) navigate(onFailedRedirect)
    try {
      const mailResponse: AxiosResponse = await axios.post(
        `${env.serverApiEndpoint}/users/otp/send`,
        { email: email },
        { withCredentials: true }
      );

      if (mailResponse.status === 200) {
        setTimeLeft(OTP_EXPIRE_TIME);
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
    }
  }, [email, navigate, onFailedRedirect])

  const handleResendOTP = () => {
    if (attempts >= MAX_ATTEMPTS) {
      toast.error("You have exceeded the maximum number of attempts.");
      return;
    }
    setTimeLeft(OTP_EXPIRE_TIME);
    sendOtp();
  };

  const verify = async () => {
    try {
      setIsLoading(true)

      if (!email) {
        navigate(onFailedRedirect)
        return
      }

      const response = await axios.post(
        `${env.serverApiEndpoint}/users/otp/verify`,
        { email: email, otp },
        { withCredentials: true }
      );

      if (response.status !== 200 && response.status !== 400) {
        toast.error(response.data.message || "failed to verify otp")
        return
      }

      if (response.data.isVerified) {
        toast.success("OTP verified successfully!");
        navigate(`${onVerifiedRedirect}/${email}`);
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400) {
          toast.warning("wrong otp try again");
          setIsOtpInvalid(true)
          setAttempts((prev) => prev + 1);
        } else {
          toast.error(error.response?.data.message || "failed to verify otp")
        }
      } else {
        console.error("Error verifying OTP:", error);
      }
    } finally {
      setIsLoading(false)
    }
  }

  // More scoped, avoids unnecessary triggers
  useEffect(() => {
    if (otp.length !== 6 || attempts >= MAX_ATTEMPTS) return;

    const timer = setTimeout(() => {
      verify();
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  return (
    <div className="max-w-md w-full mx-auto px-6 py-8 border dark:border-zinc-800 rounded-lg shadow-lg">
      <h1 className="text-3xl font-semibold mb-6 text-center">Sign Up</h1>
      <form className="space-y-5 flex justify-center items-center flex-col">
        <p className="text-sm text-foreground/60 text-center">
          Enter the 6-digit code we emailed to <b>{email}</b>. If you did not
          receive it, you can request a new one{" "}
          {timeLeft > 0 ? (
            <span>
              in <b>{timeLeft}</b> seconds
            </span>
          ) : (
            <span
              className="text-blue-500 hover:underline cursor-pointer"
              onClick={handleResendOTP}
            >
              Resend OTP
            </span>
          )}
          .
        </p>
        <InputOTP disabled={isLoading || timeLeft === 0 || attempts >= MAX_ATTEMPTS} maxLength={6} value={otp} onChange={handleOtpChange}>
          <InputOTPGroup>
            <InputOTPSlot autoFocus index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        {attempts >= MAX_ATTEMPTS && (
          <p className="text-sm text-red-500 text-center">
            You have exceeded the maximum number of attempts. Please try again
            later.
          </p>
        )}
        {isOtpInvalid && (
          <p className="text-sm text-red-500 text-center">
            Invalid OTP. Please try again.
          </p>
        )}
        <Button
          type="submit"
          disabled={isLoading || otp.length !== 6 || !email || isOtpInvalid}
          className={`w-full py-2 font-semibold rounded-md dark:text-zinc-900 bg-zinc-800 dark:bg-zinc-200 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors disabled:bg-zinc-500 disabled:cursor-wait"}`}
        >
          {isLoading ? "Verifying..." : "Verify Account"}
        </Button>
      </form>
    </div>
  );
};

export default OtpVerificationPage;
