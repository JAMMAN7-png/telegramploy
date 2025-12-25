'use client';

import { motion } from 'framer-motion';
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'success';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const variantClasses = {
    primary: 'bg-neon-cyan text-black',
    danger: 'bg-neon-magenta text-white',
    success: 'bg-neon-lime text-black',
  };

  return (
    <motion.button
      className={`btn-brutal ${variantClasses[variant]} ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
