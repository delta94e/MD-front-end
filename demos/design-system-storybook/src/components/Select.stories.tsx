import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import Select from './Select';

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Select>;

const SelectWrapper = () => {
  const [value, setValue] = useState('');
  return (
    <div style={{ minHeight: '250px', maxWidth: '300px' }}>
      <Select value={value} onChange={setValue}>
        <Select.Trigger placeholder="Choose a department..." />
        <Select.List>
          <Select.Option value="eng">Engineering</Select.Option>
          <Select.Option value="design">Product Design</Select.Option>
          <Select.Option value="marketing">Marketing & Sales</Select.Option>
          <Select.Option value="hr">Human Resources</Select.Option>
        </Select.List>
      </Select>
      <div style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
        Selected Value: <strong>{value || 'None'}</strong>
      </div>
    </div>
  );
};

export const Default: Story = {
  render: () => <SelectWrapper />,
};
