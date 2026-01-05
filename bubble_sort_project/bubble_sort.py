#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
冒泡排序算法实现
Bubble Sort Algorithm Implementation

这是一个完整的冒泡排序实现，包含多种优化和可视化功能
"""

import time
import random


class BubbleSortVisualizer:
    """冒泡排序可视化类"""
    
    def __init__(self, data=None):
        """初始化排序器"""
        self.data = data if data else []
        self.comparisons = 0
        self.swaps = 0
        self.execution_time = 0
    
    def basic_bubble_sort(self, arr=None, visualize=False):
        """
        基础冒泡排序实现
        
        Args:
            arr: 要排序的数组
            visualize: 是否显示排序过程
            
        Returns:
            tuple: (排序后的数组, 统计信息)
        """
        if arr is None:
            arr = self.data.copy()
        else:
            arr = arr.copy()
            
        n = len(arr)
        self.comparisons = 0
        self.swaps = 0
        
        start_time = time.time()
        
        for i in range(n):
            swapped = False
            
            for j in range(0, n - i - 1):
                self.comparisons += 1
                
                if arr[j] > arr[j + 1]:
                    arr[j], arr[j + 1] = arr[j + 1], arr[j]
                    self.swaps += 1
                    swapped = True
                    
                    if visualize:
                        print(f"交换: {arr[j+1]} <-> {arr[j]} 在第{i+1}轮")
                        print(f"当前数组: {arr}")
                        print("-" * 50)
            
            if not swapped:
                # 如果没有发生交换，说明已经排序完成
                break
                
        self.execution_time = time.time() - start_time
        
        stats = {
            'comparisons': self.comparisons,
            'swaps': self.swaps,
            'execution_time': self.execution_time,
            'iterations': i + 1
        }
        
        return arr, stats
    
    def optimized_bubble_sort(self, arr=None):
        """
        优化版冒泡排序：双向冒泡排序（鸡尾酒排序）
        """
        if arr is None:
            arr = self.data.copy()
        else:
            arr = arr.copy()
            
        n = len(arr)
        self.comparisons = 0
        self.swaps = 0
        
        start_time = time.time()
        
        left = 0
        right = n - 1
        iterations = 0
        
        while left < right:
            swapped = False
            
            # 从左到右
            for i in range(left, right):
                self.comparisons += 1
                if arr[i] > arr[i + 1]:
                    arr[i], arr[i + 1] = arr[i + 1], arr[i]
                    self.swaps += 1
                    swapped = True
            
            right -= 1
            
            if not swapped:
                break
                
            swapped = False
            
            # 从右到左
            for i in range(right, left, -1):
                self.comparisons += 1
                if arr[i] < arr[i - 1]:
                    arr[i], arr[i - 1] = arr[i - 1], arr[i]
                    self.swaps += 1
                    swapped = True
            
            left += 1
            iterations += 1
            
            if not swapped:
                break
                
        self.execution_time = time.time() - start_time
        
        stats = {
            'comparisons': self.comparisons,
            'swaps': self.swaps,
            'execution_time': self.execution_time,
            'iterations': iterations
        }
        
        return arr, stats
    
    def generate_test_data(self, size=10, min_val=1, max_val=100):
        """生成测试数据"""
        self.data = [random.randint(min_val, max_val) for _ in range(size)]
        return self.data
    
    def print_statistics(self, stats):
        """打印排序统计信息"""
        print("\n" + "="*60)
        print("排序统计信息")
        print("="*60)
        print(f"比较次数: {stats['comparisons']}")
        print(f"交换次数: {stats['swaps']}")
        print(f"执行时间: {stats['execution_time']:.6f} 秒")
        print(f"迭代轮数: {stats['iterations']}")
        print("="*60)


def demo_bubble_sort():
    """演示冒泡排序的各种用法"""
    
    print("🎯 冒泡排序算法演示")
    print("=" * 50)
    
    # 创建排序器实例
    sorter = BubbleSortVisualizer()
    
    # 测试数据
    test_cases = [
        [64, 34, 25, 12, 22, 11, 90],
        [5, 2, 8, 1, 9],
        [1, 2, 3, 4, 5],  # 已排序
        [5, 4, 3, 2, 1],  # 逆序
        [],  # 空数组
        [42],  # 单元素
    ]
    
    for i, test_data in enumerate(test_cases, 1):
        print(f"\n📊 测试用例 {i}: {test_data}")
        
        # 基础冒泡排序
        sorted_data, stats = sorter.basic_bubble_sort(test_data)
        print(f"基础排序结果: {sorted_data}")
        sorter.print_statistics(stats)
        
        # 优化版冒泡排序
        sorted_data_opt, stats_opt = sorter.optimized_bubble_sort(test_data)
        print(f"优化排序结果: {sorted_data_opt}")
        sorter.print_statistics(stats_opt)
        
        print("-" * 50)


def interactive_mode():
    """交互模式"""
    print("\n🎮 交互式冒泡排序")
    print("输入数字，用空格分隔 (例如: 64 34 25 12 22 11 90)")
    
    try:
        user_input = input("请输入要排序的数字: ")
        arr = list(map(int, user_input.strip().split()))
        
        if not arr:
            print("❌ 输入不能为空")
            return
            
        sorter = BubbleSortVisualizer(arr)
        
        print(f"\n原始数组: {arr}")
        
        # 显示排序过程
        sorted_arr, stats = sorter.basic_bubble_sort(arr, visualize=True)
        
        print(f"排序结果: {sorted_arr}")
        sorter.print_statistics(stats)
        
    except ValueError:
        print("❌ 请输入有效的整数")
    except KeyboardInterrupt:
        print("\n👋 用户中断")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "demo":
        demo_bubble_sort()
    elif len(sys.argv) > 1 and sys.argv[1] == "interactive":
        interactive_mode()
    else:
        print("冒泡排序程序")
        print("用法:")
        print("  python bubble_sort.py demo       - 运行演示")
        print("  python bubble_sort.py interactive - 交互模式")
        print("\n或者直接运行查看基础示例:")
        
        # 基础示例
        example_array = [64, 34, 25, 12, 22, 11, 90]
        print(f"\n原始数组: {example_array}")
        
        sorter = BubbleSortVisualizer()
        sorted_array, stats = sorter.basic_bubble_sort(example_array)
        
        print(f"排序后数组: {sorted_array}")
        sorter.print_statistics(stats)