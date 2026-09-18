import { expect, test } from '@playwright/test';

test('cria solicitação, avança status e mostra o histórico', async ({ page }) => {
  const suffix = Math.random().toString(36).replace(/[^a-z]/g, '').slice(0, 8) || 'abcdefgh';
  const nome = `Eva ${suffix}`;

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Solicitações' })).toBeVisible();

  await page.getByRole('button', { name: /nova solicitação/i }).click();
  await page.getByLabel(/nome do solicitante/i).fill(nome);
  await page.getByRole('button', { name: /criar solicitação/i }).click();

  const protocol = await page.locator('.modal__success strong').textContent();
  expect(protocol?.trim()).toMatch(/^[A-Z0-9]{10}$/);

  await expect(page.getByRole('dialog', { name: /nova solicitação/i })).toBeHidden({ timeout: 4000 });
  await expect(page.getByText(protocol!.trim())).toBeVisible();

  await page.getByRole('button', { name: `Ver detalhes e status de ${protocol!.trim()}` }).click();
  await expect(page.getByRole('dialog', { name: new RegExp(protocol!.trim()) })).toBeVisible();
  await expect(page.getByLabel(/histórico de status/i)).toBeVisible();
  await expect(page.getByText(/^Recebida$/).first()).toBeVisible();

  await page.getByRole('button', { name: /em análise/i }).click();
  await expect(page.getByText(/status atualizado com sucesso/i)).toBeVisible();
  await expect(page.getByText(/recebida → em análise/i)).toBeVisible();
});
