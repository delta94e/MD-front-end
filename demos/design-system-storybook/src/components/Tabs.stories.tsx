import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import Tabs from './Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account">
      <Tabs.List>
        <Tabs.Trigger value="account">Account Profile</Tabs.Trigger>
        <Tabs.Trigger value="password">Password Settings</Tabs.Trigger>
        <Tabs.Trigger value="notifications" disabled>Notifications</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="account">
        <div style={{ padding: '16px 0' }}>
          <h4>Account Profile Settings</h4>
          <p style={{ marginTop: '8px', color: '#666' }}>Update your profile details, avatar, and personal preferences here.</p>
        </div>
      </Tabs.Content>
      <Tabs.Content value="password">
        <div style={{ padding: '16px 0' }}>
          <h4>Change Your Password</h4>
          <p style={{ marginTop: '8px', color: '#666' }}>Ensure your account is secure by using a strong, unique password.</p>
        </div>
      </Tabs.Content>
    </Tabs>
  ),
};
