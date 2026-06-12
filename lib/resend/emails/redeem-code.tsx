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

interface RedeemCodeEmailProps {
  productName: string;
  code: string;
  signUpUrl: string;
}

export function RedeemCodeEmail({ productName, code, signUpUrl }: RedeemCodeEmailProps) {
  return (
    <Html lang="pl">
      <Head />
      <Preview>Zakup potwierdzony — Twój kod dostępu do {productName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Dziękujemy za zakup!</Heading>
          <Text style={text}>
            Twój zakup <strong>{productName}</strong> został potwierdzony.
          </Text>
          <Text style={text}>
            Aby uzyskać dostęp do kursu, utwórz konto i aktywuj go poniższym kodem:
          </Text>
          <Section style={codeBox}>
            <Text style={codeText}>{code}</Text>
          </Section>
          <Text style={text}>
            Kliknij przycisk poniżej — kod zostanie zastosowany automatycznie po rejestracji.
          </Text>
          <Section style={buttonContainer}>
            <Button href={signUpUrl} style={button}>
              Utwórz konto i aktywuj dostęp
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Kod jest ważny przez 90 dni. Jeśli to nie Ty dokonałeś/aś zakupu, skontaktuj się z nami.
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

const codeBox: React.CSSProperties = {
  backgroundColor: "#f0f4ff",
  borderRadius: "8px",
  padding: "16px",
  textAlign: "center",
  margin: "0 0 16px",
};

const codeText: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: "700",
  letterSpacing: "4px",
  color: "#1a1a1a",
  margin: "0",
  fontFamily: "monospace",
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
