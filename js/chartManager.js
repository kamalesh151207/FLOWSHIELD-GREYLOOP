/**
 * FLOWSHIELD–GREYLOOP | Professional Chart Manager
 * Clean SCADA HTML5 Canvas stream graphs with white background, subtle gridlines, and navy/blue data lines.
 */

(function (window) {
  'use strict';

  function drawFlowChart(canvasId, history) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth;
    const h = canvas.height = canvas.parentElement.clientHeight;

    ctx.clearRect(0, 0, w, h);

    // Subtle Grid lines
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let y = 30; y < h; y += 35) {
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(w - 10, y);
      ctx.stroke();
    }

    const data = history.flowRate;
    if (!data || data.length === 0) return;

    const minVal = 0;
    const maxVal = 10;
    const paddingLeft = 40;
    const paddingBottom = 25;
    const chartW = w - paddingLeft - 15;
    const chartH = h - paddingBottom - 15;

    // Y Axis Labels
    ctx.fillStyle = '#64748B';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('8 L/m', paddingLeft - 8, 35);
    ctx.fillText('4 L/m', paddingLeft - 8, 35 + chartH / 2);
    ctx.fillText('0 L/m', paddingLeft - 8, h - paddingBottom);

    const stepX = chartW / (data.length - 1);

    // Area Fill
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = paddingLeft + i * stepX;
      const y = h - paddingBottom - ((val - minVal) / (maxVal - minVal)) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(paddingLeft + chartW, h - paddingBottom);
    ctx.lineTo(paddingLeft, h - paddingBottom);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(14, 165, 233, 0.25)');
    grad.addColorStop(1, 'rgba(14, 165, 233, 0.01)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Data Line
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = paddingLeft + i * stepX;
      const y = h - paddingBottom - ((val - minVal) / (maxVal - minVal)) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Point on latest value
    const lastX = paddingLeft + (data.length - 1) * stepX;
    const lastY = h - paddingBottom - ((data[data.length - 1] - minVal) / (maxVal - minVal)) * chartH;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#0284C7';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawLevelChart(canvasId, history) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth;
    const h = canvas.height = canvas.parentElement.clientHeight;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let y = 30; y < h; y += 35) {
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(w - 10, y);
      ctx.stroke();
    }

    const data = history.waterLevel;
    if (!data || data.length === 0) return;

    const minVal = 0;
    const maxVal = 100;
    const paddingLeft = 40;
    const paddingBottom = 25;
    const chartW = w - paddingLeft - 15;
    const chartH = h - paddingBottom - 15;

    // Y Axis Labels
    ctx.fillStyle = '#64748B';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('100%', paddingLeft - 8, 35);
    ctx.fillText('50%', paddingLeft - 8, 35 + chartH / 2);
    ctx.fillText('0%', paddingLeft - 8, h - paddingBottom);

    const stepX = chartW / (data.length - 1);

    // Area Fill
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = paddingLeft + i * stepX;
      const y = h - paddingBottom - ((val - minVal) / (maxVal - minVal)) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(paddingLeft + chartW, h - paddingBottom);
    ctx.lineTo(paddingLeft, h - paddingBottom);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
    grad.addColorStop(1, 'rgba(37, 99, 235, 0.01)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Data Line
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = paddingLeft + i * stepX;
      const y = h - paddingBottom - ((val - minVal) / (maxVal - minVal)) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Point on latest value
    const lastX = paddingLeft + (data.length - 1) * stepX;
    const lastY = h - paddingBottom - ((data[data.length - 1] - minVal) / (maxVal - minVal)) * chartH;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#2563EB';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  window.ChartManager = {
    drawFlowChart,
    drawLevelChart
  };

})(window);
