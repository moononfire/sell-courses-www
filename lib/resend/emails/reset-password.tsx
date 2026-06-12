import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ResetPasswordEmailProps {
  resetUrl: string;
}

export function ResetPasswordEmail({ resetUrl }: ResetPasswordEmailProps) {
  return (
    <Html lang="pl">
      <Head />
      <Preview>Zresetuj hasło do swojego konta</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Reset hasła</Heading>
          <Text style={text}>
            Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.
            Kliknij przycisk poniżej aby ustawić nowe hasło.
            Link jest ważny przez 24 godziny.
          </Text>
          <Section style={buttonContainer}>
            <Button href={resetUrl} style={button}>
              Ustaw nowe hasło
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Jeśli to nie Ty prosiłeś/aś o reset hasła, zignoruj tę wiadomość.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "40px",
  borderRadius: "8px",
  maxWidth: "560px",
};

const h1: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0 0 16px",
};

const text: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#4a4a4a",
  margin: "0 0 16px",
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "16px 0 32px",
};

const button: React.CSSProperties = {
  backgroundColor: "#000000",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "500",
  padding: "12px 24px",
  textDecoration: "none",
};

const hr: React.CSSProperties = {
  borderColor: "#e6e6e6",
  margin: "0 0 24px",
};

const footer: React.CSSProperties = {
  fontSize: "13px",
  color: "#9a9a9a",
  margin: "0",
};
