// Typography components — OpenSpec font system
// Display: Playfair Display (headers)
// Body: Source Sans Pro (UI text)
// Data: Source Code Pro (financial amounts)

import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { typography, colors, fonts } from '@/src/theme';

interface TypographyProps extends TextProps {
  children: React.ReactNode;
}

export function DisplayText({ style, ...props }: TypographyProps) {
  return <Text style={[typography.displayHeading, style]} {...props} />;
}

export function SectionTitle({ style, ...props }: TypographyProps) {
  return <Text style={[typography.sectionTitle, style]} {...props} />;
}

export function ScreenName({ style, ...props }: TypographyProps) {
  return <Text style={[typography.screenName, style]} {...props} />;
}

export function SectionHeader({ style, ...props }: TypographyProps) {
  return <Text style={[typography.sectionHeader, style]} {...props} />;
}

export function BodyText({ style, ...props }: TypographyProps) {
  return <Text style={[typography.body, style]} {...props} />;
}

export function BodyBold({ style, ...props }: TypographyProps) {
  return <Text style={[typography.bodyBold, style]} {...props} />;
}

export function BodySmall({ style, ...props }: TypographyProps) {
  return <Text style={[typography.bodySmall, style]} {...props} />;
}

export function HeroText({ style, ...props }: TypographyProps) {
  return <Text style={[typography.hero, style]} {...props} />;
}

export function DataText({ style, ...props }: TypographyProps) {
  return <Text style={[typography.dataAmount, style]} {...props} />;
}

export function DataSmall({ style, ...props }: TypographyProps) {
  return <Text style={[typography.dataSmall, style]} {...props} />;
}

export function Sublabel({ style, ...props }: TypographyProps) {
  return <Text style={[typography.sublabel, style]} {...props} />;
}

export function Subsmall({ style, ...props }: TypographyProps) {
  return <Text style={[typography.subsmall, style]} {...props} />;
}
