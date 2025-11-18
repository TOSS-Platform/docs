# Troubleshooting

## Overview

Common issues and solutions for TOSS Protocol.

## Connection Issues

### Cannot Connect to zkSync

**Problem**: Cannot connect to zkSync network

**Solutions**:
1. Check RPC URL is correct
2. Verify network is zkSync Era (not mainnet)
3. Check internet connection
4. Try different RPC endpoint

### Wallet Connection Fails

**Problem**: Wallet won't connect

**Solutions**:
1. Refresh page
2. Check wallet is unlocked
3. Verify wallet supports zkSync
4. Clear browser cache

## Transaction Issues

### Transaction Stuck

**Problem**: Transaction pending for too long

**Solutions**:
1. Check network congestion
2. Verify gas price is sufficient
3. Try increasing gas limit
4. Wait for network to process

### Transaction Reverted

**Problem**: Transaction fails with revert error

**Solutions**:
1. Check error message for specific reason
2. Verify you have sufficient balance
3. Check if contract is paused
4. Verify parameters are correct

## Fund Issues

### Cannot Create Fund

**Problem**: Fund creation fails

**Solutions**:
1. Verify sufficient TOSS stake
2. Check FM registration status
3. Validate fund configuration
4. Ensure all required parameters provided

### NAV Not Updating

**Problem**: NAV not updating after trades

**Solutions**:
1. NAV updates hourly (normal delay)
2. Check NAV Engine is operational
3. Verify trade was successful
4. Check for NAV update events

## Withdrawal Issues

### Withdrawal Delayed

**Problem**: Withdrawal not processed

**Solutions**:
1. Check lockup period expired
2. Verify withdrawal is in queue
3. Check daily withdrawal limits
4. Wait for queue processing (24 hours)

### Withdrawal Failed

**Problem**: Withdrawal request fails

**Solutions**:
1. Check sufficient shares
2. Verify fund status allows withdrawals
3. Check investor state (not frozen/banned)
4. Verify daily limit not exceeded

## Performance Issues

### Slow Queries

**Problem**: Queries taking too long

**Solutions**:
1. Check network connection
2. Verify RPC endpoint is responsive
3. Try different endpoint
4. Reduce query scope

---

**Related**: [MCP Troubleshooting](/mcp-integration/troubleshooting), [Technical Support](/technical/intro), [FAQ](/faq)

