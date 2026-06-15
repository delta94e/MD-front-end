import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import Card from './Card';
import Button from './Button';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    bordered: { control: 'boolean' },
    shadow: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} style={{ maxWidth: '400px' }}>
      <Card.Header>
        <Card.Title>Card Title</Card.Title>
        <Card.Description>This is a description inside Card.Header</Card.Description>
      </Card.Header>
      <Card.Body>
        This is the body content of the card. Because of composition, you can place anything here: text, images, inputs, list items.
      </Card.Body>
      <Card.Footer>
        <Button size="sm" variant="secondary">Cancel</Button>
        <Button size="sm" variant="primary">Confirm</Button>
      </Card.Footer>
    </Card>
  ),
  args: {
    bordered: true,
    shadow: 'md',
  },
};

export const WithoutHeader: Story = {
  render: (args) => (
    <Card {...args} style={{ maxWidth: '400px' }}>
      <Card.Body>
        <h4 style={{ marginBottom: '8px' }}>Card Without Header</h4>
        Only body text and a footer action. Extremely flexible.
      </Card.Body>
      <Card.Footer>
        <Button size="sm" variant="outline" style={{ width: '100%' }}>Action Link</Button>
      </Card.Footer>
    </Card>
  ),
  args: {
    bordered: true,
    shadow: 'sm',
  },
};
